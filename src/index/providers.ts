import * as vscode from 'vscode';

import { WorkspaceIndex } from '../index/index';


export class DefinitionProvider implements vscode.DefinitionProvider {
  provideDefinition(document: vscode.TextDocument, position: vscode.Position): vscode.Location {
    // TODO: need to parse hil

    return null;
  }
}

export class ReferenceProvider implements vscode.ReferenceProvider {
  provideReferences(document: vscode.TextDocument, position: vscode.Position, context: vscode.ReferenceContext): vscode.Location[] {
    // TODO: parse hil

    return [];
  }
}

export class DocumentSymbolProvider implements vscode.DocumentSymbolProvider {
  provideDocumentSymbols(document: vscode.TextDocument): vscode.SymbolInformation[] {
    return WorkspaceIndex.query(document.uri);
  }
}

export class WorkspaceSymbolProvider implements vscode.WorkspaceSymbolProvider {
  provideWorkspaceSymbols(query: string): vscode.SymbolInformation[] {
    return WorkspaceIndex.query("ALL_FILES", { name: query });
  }
}

export class RenameProvider implements vscode.RenameProvider {
  provideRenameEdits(document: vscode.TextDocument, position: vscode.Position, newName: string): vscode.WorkspaceEdit {
    let range = document.getWordRangeAtPosition(position);
    if (range === undefined) {
      return null;
    }

    let symbol = document.getText(range);
    let references = []; // TODO: implement references
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