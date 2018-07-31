import * as _ from "lodash";
import * as vscode from 'vscode';
import { backwardsSearch } from '../helpers';
import { AstPosition, getTokenAtPosition } from '../index/ast';
import { parseHcl } from '../index/hcl-hil';
import { IndexAdapter } from "../index/index-adapter";
import { Section } from "../index/section";
import { Logger } from "../logger";
import { Reporter } from "../telemetry";
import { GetKnownFunctions, InterpolationFunctionDefinition } from './builtin-functions';
import { allProviders, IFieldDef, terraformConfigAutoComplete } from './model';
import { SectionCompletions } from './section-completions';

const resourceExp = new RegExp("(resource|data)\\s+(\")?(\\w+)(\")?\\s+(\")?([\\w\\-]+)(\")?\\s+({)");
const terraformExp = new RegExp("(variable|output|module)\\s+(\")?([\\w\\-]+)(\")?\\s+({)");
const nestedRegexes: RegExp[] = [/\w[A-Za-z0-9\-_]*(\s*){/, /\w[A-Za-z0-9\-_]*(\s*)=(\s*){/];
const propertyExp = new RegExp("^([\\w_-]+)$");

export class CompletionProvider implements vscode.CompletionItemProvider {
  private logger = new Logger("completion-provider");

  constructor(private index: IndexAdapter) { }

  private sectionToCompletionItem(section: Section, needInterpolation: boolean, range?: vscode.Range): vscode.CompletionItem {
    let item = new vscode.CompletionItem(section.id());
    switch (section.sectionType) {
      case "variable": item.kind = vscode.CompletionItemKind.Variable; break;
      case "data": item.kind = vscode.CompletionItemKind.Struct; break;
      case "resource": item.kind = vscode.CompletionItemKind.Class; break;
      case "output": item.kind = vscode.CompletionItemKind.Value; break;
    }
    if (needInterpolation) {
      item.insertText = '${' + item.label + '}';
    }
    if (range) {
      item.range = range;
    }
    // sort sections before functions
    item.sortText = `000-${section.id()}`;
    return item;
  }

  private knownFunctionToCompletionItem(fd: InterpolationFunctionDefinition, needInterpolation: boolean, range?: vscode.Range): vscode.CompletionItem {
    let prototype = fd.name + '(' + fd.parameters.join(", ") + ')';
    let item = new vscode.CompletionItem(prototype);
    item.kind = vscode.CompletionItemKind.Function;
    let snippet = new vscode.SnippetString();
    if (needInterpolation) {
      snippet.appendText('${');
    }
    snippet.appendText(fd.name);
    snippet.appendText('(');
    fd.parameters.forEach((parameter, index, array) => {
      snippet.appendPlaceholder(parameter);
      if (index !== array.length - 1)
        snippet.appendText(', ');
    });
    snippet.appendText(')');
    if (needInterpolation) {
      snippet.appendText('}');
    }
    item.insertText = snippet;
    if (range) {
      item.range = range;
    }
    // sort functions after functions
    item.sortText = `001-${fd.name}`;
    item.filterText = fd.name;
    return item;
  }

  private interpolationCompletions(document: vscode.TextDocument, position: vscode.Position): vscode.CompletionItem[] | undefined {
    let beforeRange = new vscode.Range(new vscode.Position(position.line, 0), position);
    let before = document.getText(beforeRange);

    let start = before.lastIndexOf("${");
    let needInterpolation = false; // do we need to insert ${ aswell?
    let interpolation = "";
    if (start === -1) {
      if (before[before.length - 1] === '"') {
        needInterpolation = true;
        interpolation = "";
      } else {
        return [];
      }
    } else {
      // everything except ${
      interpolation = before.substring(start + 2);
    }

    // we are inside a string interpolation
    let filterStartPos = backwardsSearch(interpolation, (ch) => '({[ -+/]})'.indexOf(ch) !== -1);
    if (filterStartPos === -1)
      filterStartPos = 0; // use entire string after ${ as filter
    else
      filterStartPos += 1; // do not include matching character

    let [file, group] = this.index.indexDocument(document);
    if (!file || !group)
      return [];

    let filter = interpolation.substring(filterStartPos).trim();
    if (filter.length === 0) {
      return group.query("ALL_FILES", { unique: true }).map((s) => {
        return this.sectionToCompletionItem(s, needInterpolation);
      }).concat(...GetKnownFunctions().map((f) => this.knownFunctionToCompletionItem(f, needInterpolation)));
    }

    const wordRangeAtPos = document.getWordRangeAtPosition(position);
    let replaceRange = new vscode.Range(
      position.translate(0, -filter.length),
      wordRangeAtPos ? document.getWordRangeAtPosition(position).end : position
    );

    return group.query("ALL_FILES", { id: { type: "PREFIX", match: filter }, unique: true }).map((s) => {
      return this.sectionToCompletionItem(s, needInterpolation, replaceRange);
    }).concat(...GetKnownFunctions().filter(f => f.name.indexOf(filter) === 0).map((f) => this.knownFunctionToCompletionItem(f, needInterpolation, replaceRange)));
  }

  provideCompletionItems(document: vscode.TextDocument, position: vscode.Position): vscode.CompletionItem[] {
    try {
      // figure out if we are inside a string
      const [ast, error] = parseHcl(document.getText());
      if (ast) {
        let offset1 = document.offsetAt(position);
        let pos: AstPosition = {
          Line: position.line + 1,
          Column: position.character + 1,
          Offset: 0,
          Filename: ''
        };
        let token = getTokenAtPosition(ast, pos);
        if (token) {
          let interpolationCompletions = this.interpolationCompletions(document, position);
          if (interpolationCompletions.length !== 0)
            return interpolationCompletions;
        }
      }

      // TODO: refactor to use ast here aswell
      let lineText = document.lineAt(position.line).text;
      let lineTillCurrentPosition = lineText.substr(0, position.character);

      // high-level types ex: variable, resource, module, output etc..
      if (position.character === 0 || this.isTerraformTypes(lineText)) {
        return this.getFilteredTerraformTypes(lineText);
      }

      // resource | data "resource type auto completion"
      let possibleResources: any[] = this.lookupForTerraformResource(lineTillCurrentPosition);
      if (possibleResources.length > 0) {
        return this.getAutoCompletion(possibleResources, vscode.CompletionItemKind.Class);
      }

      // auto-completion for property types including 1 level deeep nested types
      if (lineTillCurrentPosition.trim().length === 0 || propertyExp.test(lineTillCurrentPosition.trim())) {
        let prev: number = position.line - 1;
        let nestedTypes: string[] = [];
        let parentResource: string = "";
        let parentType: string = "";
        let nestedCounts: number = 0;
        while (prev >= 0) {
          let line: string = document.lineAt(prev).text;
          // nested closing block
          if (line.trim() === "}") {
            nestedCounts++;
          }
          // for now only 1-level deep
          if (this.isNestedLevelType(line) && nestedCounts === 0) {
            nestedTypes.push(this.getTypeFromLine(line, 0));
          }
          if (this.typedMatched(line, terraformExp)) {
            parentType = this.getTypeFromLine(line, 0);
            break;
          }
          if (this.typedMatched(line, resourceExp)) {
            parentType = this.getTypeFromLine(line, 0);
            parentResource = this.getTypeFromLine(line, 1);
            break;
          }
          prev--;
        }

        if (nestedTypes.length > 0 && parentResource.length > 0) {
          let resourceInfo = allProviders[parentType][parentResource];
          if (!resourceInfo) {
            return [];
          }

          let temp: any = { items: resourceInfo.args };
          let fieldArgs: IFieldDef[] = _.cloneDeep(temp).items;
          if (parentType === "resource") {
            fieldArgs.push(...terraformConfigAutoComplete.resource);
          }
          fieldArgs.push(...resourceInfo.args);
          let argumentsLength: number = nestedTypes.length - 1;
          let lastArgName: string = "";
          while (argumentsLength >= 0) {
            const field: IFieldDef = fieldArgs.find((arg) => arg.name === nestedTypes[argumentsLength]);
            fieldArgs = field.args;
            lastArgName = field.name;
            argumentsLength--;
          }
          return this.getItemsForArgs(fieldArgs, lastArgName);
        } else if (parentResource.length > 0) {
          let resourceInfo = allProviders[parentType][parentResource];
          if (!resourceInfo) {
            return [];
          }

          let temp: any = { items: resourceInfo.args };
          let fieldArgs: IFieldDef[] = _.cloneDeep(temp).items;
          if (parentType === "resource") {
            fieldArgs.push(...terraformConfigAutoComplete.resource);
          }
          return this.getItemsForArgs(fieldArgs, parentResource);
        } else if (parentType.length > 0 && nestedTypes.length === 0) {
          let fieldArgs: IFieldDef[] = terraformConfigAutoComplete[parentType];
          return this.getItemsForArgs(fieldArgs, parentType);
        }
      }
    } catch (error) {
      this.logger.exception("Failed to provide completions", error);
      Reporter.trackException("provideCompletionItems", error);
    }
    return [];
  }

  private lookupForTerraformResource(lineTillCurrentPosition: string): any[] {
    let parts: string[] = lineTillCurrentPosition.split(" ");
    if (parts.length === 2 && (parts[0] === "resource" || parts[0] === "data")) {
      let r: string = parts[1].replace(/"/g, "");
      let regex: RegExp = new RegExp("^" + r);
      let possibleResources: any = _.filter(_.keys(allProviders[parts[0]]), k => {
        if (regex.test(k)) {
          return true;
        }
      });
      return possibleResources;
    }
    return [];
  }

  private getAutoCompletion(strings: string[], type: vscode.CompletionItemKind): vscode.CompletionItem[] {
    return _.map(strings, s => {
      return new vscode.CompletionItem(s, type);
    });
  }

  private isNestedLevelType(line: string): boolean {
    for (let i: number = 0; i < nestedRegexes.length; i++) {
      if (nestedRegexes[i].test(line)) {
        return true;
      }
    }
    return false;
  }

  private getTypeFromLine(line: string, at: number): string {
    let lineParts: string[] = line.trim().split(" ");
    let type: string = lineParts[at];
    return type.replace(/"|=/g, "");
  }

  private getItemsForArgs(args: IFieldDef[], type: string): any {
    return _.map(args, o => {
      let c = new vscode.CompletionItem(`${o.name} (${type})`, vscode.CompletionItemKind.Property);
      c.detail = o.description;
      c.insertText = o.name;
      return c;
    });
  }

  private typedMatched(line: string, exp: RegExp): boolean {
    return exp.test(line);
  }

  private getFilteredTerraformTypes(line: string): vscode.CompletionItem[] {
    if (line.length === 0) {
      return SectionCompletions;
    } else {
      return SectionCompletions.filter(v => v.label.indexOf(line) === 0);
    }
  }

  private isTerraformTypes(line: string): boolean {
    return SectionCompletions.findIndex(v => v.label.indexOf(line) === 0) !== -1;
  }
}
