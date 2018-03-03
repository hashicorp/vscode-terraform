import * as vscode from 'vscode';
import * as _ from "lodash"

import { index } from './index';
import { terraformConfigAutoComplete, allProviders, IFieldDef } from './model';
import { TextDocument } from 'vscode';

const resourceExp = new RegExp("(resource|data)\\s+(\")?(\\w+)(\")?\\s+(\")?([\\w\\-]+)(\")?\\s+({)");
const terraformExp = new RegExp("(variable|output|module)\\s+(\")?([\\w\\-]+)(\")?\\s+({)");
const nestedRegexes: RegExp[] = [/\w[A-Za-z0-9\-_]*(\s*){/, /\w[A-Za-z0-9\-_]*(\s*)=(\s*){/];
const propertyExp = new RegExp("^([\\w_-]+)$");

const variablesAndFields = ["variable", "output"]
const classes = ["locals"]
const modules = ["module", "provider"]
const interfaces = ["resource", "data"]

export class DefinitionProvider implements vscode.DefinitionProvider {
  provideDefinition(document: vscode.TextDocument, position: vscode.Position): vscode.Location {
    return index.findDefinition(document, position);
  }
}

export class ReferenceProvider implements vscode.ReferenceProvider {
  provideReferences(document: vscode.TextDocument, position: vscode.Position, context: vscode.ReferenceContext): vscode.Location[] {
    let range = document.getWordRangeAtPosition(position);
    return index.findReferences(document.getText(range));
  }
}

export class CompletionProvider implements vscode.CompletionItemProvider {
  private getVariables(position: vscode.Position, includePrefix: boolean, match?: string): vscode.CompletionItem[] {
    return index.getVariables(match).map((v) => {
      let item = new vscode.CompletionItem(v);
      item.kind = vscode.CompletionItemKind.Variable;
      if (includePrefix) {
        let range = new vscode.Range(position, position);
        item.textEdit = new vscode.TextEdit(range, `var.${v}`);
      }
      return item;
    });
  }

  private getOutputs(match?: string): vscode.CompletionItem[] {
    return index.getOutputs(match).map((o) => {
      let item = new vscode.CompletionItem(o);
      item.kind = vscode.CompletionItemKind.Property;
      return item;
    });
  }

  provideCompletionItems(document: vscode.TextDocument, position: vscode.Position): vscode.CompletionItem[] {
    let range = new vscode.Range(new vscode.Position(position.line, 0), position);
    let before = document.getText(range);

    if (before.endsWith("var.")) {
      return this.getVariables(position, false);
    } else if (before.endsWith("${")) {
      let variables = this.getVariables(position, true);
      let outputs = this.getOutputs();

      return variables.concat(outputs);
    }

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
        let fieldArgs: IFieldDef[] = terraformConfigAutoComplete[parentType];
        return this.getItemsForArgs(fieldArgs, parentType);
      }
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
    let items = this.getMergedTerraformTypes();
    if (line.length === 0) {
      return items;
    } else {
      return items.filter(v => v.label.indexOf(line) === 0);
    }
  }

  private isTerraformTypes(line: string): boolean {
    let items = this.getMergedTerraformTypes();
    return items.findIndex(v => v.label.indexOf(line) === 0) !== -1;
  }

  private getMergedTerraformTypes(): vscode.CompletionItem[] {
    let items = this.getAutoCompletion(variablesAndFields, vscode.CompletionItemKind.Variable);
    items.push(...this.getAutoCompletion(classes, vscode.CompletionItemKind.Class));
    items.push(...this.getAutoCompletion(modules, vscode.CompletionItemKind.Module));
    items.push(...this.getAutoCompletion(interfaces, vscode.CompletionItemKind.Interface));
    return items;
  }
}

export class DocumentSymbolProvider implements vscode.DocumentSymbolProvider {
  provideDocumentSymbols(document: vscode.TextDocument): vscode.SymbolInformation[] {
    return index.getDocumentSymbols(document.uri);
  }
}

export class WorkspaceSymbolProvider implements vscode.WorkspaceSymbolProvider {
  provideWorkspaceSymbols(query: string): vscode.SymbolInformation[] {
    return index.getSymbols(query);
  }
}

export class RenameProvider implements vscode.RenameProvider {
  provideRenameEdits(document: vscode.TextDocument, position: vscode.Position, newName: string): vscode.WorkspaceEdit {
    let range = document.getWordRangeAtPosition(position);
    if (range === undefined) {
      return null;
    }

    let symbol = document.getText(range);
    let references = index.findReferences(document.getText(range));
    if (references.length === 0) {
      return null;
    }

    const magic = 4; // length("var.")
    let edit = new vscode.WorkspaceEdit;
    edit.replace(document.uri, range, newName);
    references.forEach((location) => {
      let r = new vscode.Range(
        new vscode.Position(location.range.start.line, location.range.start.character + magic),
        new vscode.Position(location.range.start.line, location.range.start.character + magic + symbol.length));

      edit.replace(location.uri, r, newName);
    });
    return edit;
  }
}
