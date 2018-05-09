import * as vscode from 'vscode';
import { Index } from '.';

export class DefinitionProvider implements vscode.DefinitionProvider {
  constructor(private index: Index) { }

  provideDefinition(document: vscode.TextDocument, position: vscode.Position): vscode.Location {
    let reference = this.index.queryReferences(document.uri, { position: position })[0];
    if (!reference)
      return null;

    let section = this.index.query("ALL_FILES", reference.getQuery())[0];
    if (!section)
      return null;
    return section.location;
  }
}

export class ReferenceProvider implements vscode.ReferenceProvider {
  constructor(private index: Index) { }

  provideReferences(document: vscode.TextDocument, position: vscode.Position, context: vscode.ReferenceContext): vscode.Location[] {
    let section = this.index.query(document.uri, { position: position })[0];
    if (!section)
      return [];

    let references = this.index.queryReferences("ALL_FILES", { target: section });
    return references.map((r) => r.location);
  }
}

export class DocumentSymbolProvider implements vscode.DocumentSymbolProvider {
  constructor(private index: Index) { }

  provideDocumentSymbols(document: vscode.TextDocument): vscode.SymbolInformation[] {
    return this.index.query(document.uri);
  }
}

export class WorkspaceSymbolProvider implements vscode.WorkspaceSymbolProvider {
  constructor(private index: Index) { }

  provideWorkspaceSymbols(query: string): vscode.SymbolInformation[] {
    return this.index.query("ALL_FILES", { name: query });
  }
}

export class RenameProvider implements vscode.RenameProvider {
  constructor(private index: Index) { }

  provideRenameEdits(document: vscode.TextDocument, position: vscode.Position, newName: string): vscode.WorkspaceEdit {
    let section = this.index.query(document.uri, { name_position: position })[0];
    if (!section) {
      return null;
    }

    let references = this.index.queryReferences("ALL_FILES", { target: section });
    if (references.length === 0) {
      return null;
    }

    let edit = new vscode.WorkspaceEdit;
    edit.replace(document.uri, section.nameLocation.range, newName);

    const newId = section.id(newName);
    references.forEach((reference) => {
      if (!reference.nameRange) {
        // references in .tf
        edit.replace(reference.location.uri, reference.location.range, newId);
      } else {
        // references in .tfvars
        edit.replace(reference.location.uri, reference.nameRange, newName);
      }
    });
    return edit;
  }
}