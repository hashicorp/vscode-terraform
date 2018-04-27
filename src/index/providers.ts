import * as vscode from 'vscode';

import { WorkspaceIndex } from '../index/index';


export class DefinitionProvider implements vscode.DefinitionProvider {
  provideDefinition(document: vscode.TextDocument, position: vscode.Position): vscode.Location {
    let reference = WorkspaceIndex.queryReferences(document.uri, { position: position })[0];
    if (!reference)
      return null;

    let section = WorkspaceIndex.query("ALL_FILES", reference.getQuery())[0];
    if (!section)
      return null;
    return section.location;
  }
}

export class ReferenceProvider implements vscode.ReferenceProvider {
  provideReferences(document: vscode.TextDocument, position: vscode.Position, context: vscode.ReferenceContext): vscode.Location[] {
    let section = WorkspaceIndex.query(document.uri, { position: position })[0];
    if (!section)
      return [];

    let references = WorkspaceIndex.queryReferences("ALL_FILES", { target: section });
    return references.map((r) => r.location);
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
    let section = WorkspaceIndex.query(document.uri, { name_position: position })[0];
    if (!section) {
      return null;
    }

    let references = WorkspaceIndex.queryReferences("ALL_FILES", { target: section });
    if (references.length === 0) {
      return null;
    }

    let edit = new vscode.WorkspaceEdit;
    edit.replace(document.uri, section.nameLocation.range, newName);

    const newId = section.id(newName);
    references.forEach((reference) => {
      edit.replace(reference.location.uri, reference.location.range, newId);
    });
    return edit;
  }
}