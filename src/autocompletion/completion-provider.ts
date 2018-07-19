import * as _ from "lodash";
import * as vscode from 'vscode';
import { backwardsSearch } from '../helpers';
import { Index } from '../index';
import { AstPosition, getTokenAtPosition } from '../index/ast';
import { parseHcl } from '../index/hcl-hil';
import { Section } from "../index/section";
import { GetKnownFunctions, InterpolationFunctionDefinition } from './builtin-functions';
import { IFieldDef, IModuleArgsDef, allProviders, moduleSources, terraformConfigAutoComplete } from './model';
import { SectionCompletions } from './section-completions';
import { IndexLocator } from "../index/index-locator";

const resourceExp = new RegExp("(resource|data)\\s+(\")?(\\w+)(\")?\\s+(\")?([\\w\\-]+)(\")?\\s+({)");
const terraformExp = new RegExp("(variable|output|module)\\s+(\")?([\\w\\-]+)(\")?\\s+({)");
const nestedRegexes: RegExp[] = [/\w[A-Za-z0-9\-_]*(\s*){/, /\w[A-Za-z0-9\-_]*(\s*)=(\s*){/];
const propertyExp = new RegExp("^([\\w_-]+)$");
let count: number = 1
export class CompletionProvider implements vscode.CompletionItemProvider {
  constructor(private indexLocator: IndexLocator) { }

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

    let filter = interpolation.substring(filterStartPos).trim();
    if (filter.length === 0) {
      return this.indexLocator.getIndexForDoc(document).query("ALL_FILES").map((s) => {
        return this.sectionToCompletionItem(s, needInterpolation);
      }).concat(...GetKnownFunctions().map((f) => this.knownFunctionToCompletionItem(f, needInterpolation)));
    }

    let replaceRange = new vscode.Range(
      position.translate(0, -filter.length),
      document.getWordRangeAtPosition(position).end
    );
    return this.indexLocator.getIndexForDoc(document).query("ALL_FILES", { id: filter }).map((s) => {
      return this.sectionToCompletionItem(s, needInterpolation, replaceRange);
    }).concat(...GetKnownFunctions().map((f) => this.knownFunctionToCompletionItem(f, needInterpolation, replaceRange)));
  }

  provideCompletionItems(document: vscode.TextDocument, position: vscode.Position): vscode.CompletionItem[] {
    // figure out if we are inside a string
    const [ast, error] = parseHcl(document.getText());
    let lineText = document.lineAt(position.line).text;
    let lineTillCurrentPosition = lineText.substr(0, position.character);
    // Module source completion
    let possibleSources: any[] = this.lookupForModuleSource(lineTillCurrentPosition);
    if (possibleSources.length > 0) {
      return this.getModuleAutoCompletion(possibleSources, vscode.CompletionItemKind.Class);
    }

    if (ast) {
      let offset1 = document.
      offsetAt(position);
      let pos: AstPosition = {
        Line: position.line + 1,
        Column: position.character + 1,
        Offset: 0,
        Filename: ''
      };
      let token = getTokenAtPosition(ast, pos);
      if (token) {

        // Local completion and function completion
        let interpolationCompletions = this.interpolationCompletions(document, position);
        if (interpolationCompletions.length !== 0)
          return interpolationCompletions;
      }
    }

    // TODO: refactor to use ast here aswell

    // high-level types ex: variable, resource, module, output etc..
    if (position.character === 0 || this.isTerraformTypes(lineText)) {
      return this.getFilteredTerraformTypes(lineText);
    }

    // resource | data "resource type auto completion"
    let possibleResources: any[] = this.lookupForTerraformResource(lineTillCurrentPosition);
    if (possibleResources.length > 0) {
      return this.getAutoCompletion(possibleResources, vscode.CompletionItemKind.Class);
    }

    // resource | data " parameters auto completion"
    let parts: string[] = lineTillCurrentPosition.split(" ");
    if (parts.length === 4 && (parts[0] === "resource" || parts[0] === "data") && parts[3] === "{") {
      let item = new vscode.CompletionItem("Default Parameter", vscode.CompletionItemKind.Module);
      let type = this.getTypeFromLine(lineTillCurrentPosition, 0);
      let resourceType = this.getTypeFromLine(lineTillCurrentPosition, 1);

      let typeparameters = allProviders[type][resourceType];
      let parameters: IFieldDef[] = typeparameters.args;
      let snippet: string = '\n';
      let regex = new RegExp("Required");
      let order: number = 1;
      for (let parameter of parameters) {
        if (regex.test(parameter.description)) {
          snippet += '  ' + parameter.name + ' = "${' + order.toString() + ':' + parameter.name + '}"\n';
          order += 1;
        }
      }
      snippet += '\n';
      item.insertText = new vscode.SnippetString(snippet);
      let completionList: vscode.CompletionItem[] = [];
      completionList[0] = item;
      return completionList;
    }

    // auto-completion for property types including 1 level deeep nested types
    if (lineTillCurrentPosition.trim().length === 0 || propertyExp.test(lineTillCurrentPosition.trim())) {
      let prev: number = position.line - 1;
      let nestedTypes: string[] = [];
      let parentResource: string = "";
      let parentType: string = "";
      let nestedCounts: number = 0;
      let sourceResource: string = "";
      while (prev >= 0) {
        let line: string = document.lineAt(prev).text;
        // if it is module, we have to store source parameters as parentResource
        let parameterParts: string[] = line.split(" ");
        if (parameterParts[2] === "source") {
          sourceResource = parameterParts[parameterParts.length - 1].replace(/"|=/g, "");
        }
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
        let temp: any = { items: allProviders[parentType][parentResource].args };
        let fieldArgs: IFieldDef[] = _.cloneDeep(temp).items;
        if (parentType === "resource") {
          fieldArgs.push(...terraformConfigAutoComplete.resource);
        }
        fieldArgs.push(...allProviders[parentType][parentResource].args);
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
        let temp: any = { items: allProviders[parentType][parentResource].args };
        let fieldArgs: IFieldDef[] = _.cloneDeep(temp).items;
        if (parentType === "resource") {
          fieldArgs.push(...terraformConfigAutoComplete.resource);
        }
        return this.getItemsForArgs(fieldArgs, parentResource);
      } else if (parentType.length > 0 && nestedTypes.length === 0) {
        let temp: any = { items: moduleSources[sourceResource].args };
        let fieldArgs: IModuleArgsDef[] = _.cloneDeep(temp).items;
        if (parentType === "module") {
          fieldArgs.push(...terraformConfigAutoComplete.module);
        }
        return this.getModuleItemsForArgs(fieldArgs, sourceResource);
      }
    }
    return [];
  }

  private lookupForTerraformResource(lineTillCurrentPosition: string): any[] {
    let parts: string[] = lineTillCurrentPosition.split(" ");

    if (parts.length === 2 && (parts[0] === "resource" || parts[0] === "data" || parts[0] === "module")) {
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

  private lookupForModuleSource(lineTillCurrentPosition: string): any[] {
    let parts: string[] = lineTillCurrentPosition.split(" ");

    if (parts.length === 5 && (parts[2] === "source" && parts[3] === "=" )) {
      let r: string = parts[4].replace(/"/g, "");
      let regex: RegExp = new RegExp("^" + r);
      let possibleSources: any = _.filter(_.keys(moduleSources), k => {
        if (regex.test(k)) {
          return true;
        }
      });
      return possibleSources;
    }
    return [];
  }

  private getAutoCompletion(strings: string[], type: vscode.CompletionItemKind): vscode.CompletionItem[] {
    return _.map(strings, s => {
      let completionList = new vscode.CompletionItem(s, type);
      let order: string = count.toString()
      completionList.sortText = "0".repeat(5 - order.length) + order;
      count = count + 1
      let snippet = s + '" "${1:name}'
      completionList.insertText = new vscode.SnippetString(snippet)
      return completionList;
    });
  }

  private getModuleAutoCompletion(strings: string[], type: vscode.CompletionItemKind): vscode.CompletionItem[] {
    return _.map(strings, s => {
      let completionList = new vscode.CompletionItem(s, type);
      let typeparameters = moduleSources[s];
      let parameters: IModuleArgsDef[] = typeparameters.args;
      let snippet: string = s;
      let parameterOrder: number = 1;
      for (let parameter of parameters) {
        if (parameter.default === "") {
          snippet += '"\n';
          snippet += parameter.name + ' = "${' + parameterOrder.toString() + ':' + parameter.name + '}';
          parameterOrder += 1;
        }
      }
      completionList.insertText = new vscode.SnippetString(snippet);
      let order: string = count.toString()
      completionList.sortText = "0".repeat(5 - order.length) + order;
      count = count + 1
      return completionList;
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

  private getModuleItemsForArgs(args: IModuleArgsDef[], type: string): any {
    return _.map(args, o => {
      let c = new vscode.CompletionItem(`${o.name} (${type})`, vscode.CompletionItemKind.Property);
      c.detail = o.description;
      let defaultValue: string = o.default.replace(/\n|\s/g, "");
      let snippet = o.name + ' = ' + defaultValue;
      if (defaultValue.length >= 2 && defaultValue[0] === '"' &&  defaultValue[defaultValue.length - 1] === '"') {
        defaultValue = defaultValue.replace(/\"/g, "");
        snippet = o.name + ' = "${1:' + defaultValue + '}"';
      } else if (defaultValue.length >= 2 && defaultValue[0] === '[' &&  defaultValue[defaultValue.length - 1] === ']') {
        defaultValue = defaultValue.replace(/\[\s*/g, "").replace(/\s*\]/g, "");
        snippet = o.name + ' = [${1:' + defaultValue + '}]';
      } else if (defaultValue.length >= 2 && defaultValue[0] === '{' &&  defaultValue[defaultValue.length - 1] === '}') {
        defaultValue = defaultValue.replace(/\{\s*/g, "").replace(/\s*\}/g, "");
        let positions: number[];
        let space: string = "";
        let pos = defaultValue.indexOf(":");
        let startPos = 0;
        let endPos = defaultValue.length - 1;
        let order: number = 1;
        snippet = o.name + ' = {\n';
        while (pos > -1) {
          let item: string = defaultValue.substr(startPos, pos - startPos);
          let value: string = defaultValue.substr(pos + 1, endPos - pos - 1);
          if (order === 1) {
            space = "  ";
          }
          snippet += space + '${' + order.toString() + ':' + item.replace(/\"|\n/g, "") + '}' + ' = ';
          order += 1;
          if (defaultValue[pos + 1] === "[") {
            value = defaultValue.substr(pos + 1).match( /\[(.*?)\]/g).map(str => str.substr(1, str.length - 2))[0];
            snippet += '[${' + order.toString() + ':' + value + '}]' + '\n';
            order += 1;
          } else if (defaultValue[pos + 1] === '\"') {
            value = defaultValue.match( /\"(.*?)\"/g).map(str => str.substr(1, str.length - 2))[0];
            snippet += '"${' + order.toString() + ':' + value + '}"' + '\n';
            order += 1;
          }
          startPos = pos + value.length + 2 + 2;
          pos = defaultValue.indexOf(":", startPos);
        }
        snippet += '}\n';
      }
      c.insertText = new vscode.SnippetString(snippet);
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
