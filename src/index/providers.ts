import * as vscode from 'vscode';
import { Index } from '.';

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