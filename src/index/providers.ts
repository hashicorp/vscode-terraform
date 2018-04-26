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
    if (!range) {
      return null;
    }

    // find section with nameLoc == range
    let symbol = document.getText(range);
    let section = WorkspaceIndex.query(document.uri).filter((s) => s.nameLocation.range.isEqual(range))[0];
    if (!section) {
      return null;
    }

    let references = WorkspaceIndex.getReferences("ALL_FILES", section);
    if (references.length === 0) {
      return null;
    }

    let edit = new vscode.WorkspaceEdit;
    edit.replace(document.uri, range, newName);

    const newId = section.id(newName);
    references.forEach((reference) => {
      edit.replace(reference.location.uri, reference.location.range, newId);
    });
    return edit;
  }
}