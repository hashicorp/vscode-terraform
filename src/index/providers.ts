import * as vscode from 'vscode';
import { IndexLocator } from './index-locator';

export class ReferenceProvider implements vscode.ReferenceProvider {
  constructor(private indexLocator: IndexLocator) { }

  provideReferences(document: vscode.TextDocument, position: vscode.Position, context: vscode.ReferenceContext): vscode.Location[] {
    let section = this.indexLocator.getIndexForDoc(document).query(document.uri, { position: position })[0];
    if (!section)
      return [];

    let references = this.indexLocator.getIndexForDoc(document).queryReferences("ALL_FILES", { target: section });
    return references.map((r) => r.location);
  }
}

export class DocumentSymbolProvider implements vscode.DocumentSymbolProvider {
  constructor(private indexLocator: IndexLocator) { }

  provideDocumentSymbols(document: vscode.TextDocument): vscode.SymbolInformation[] {
    return this.indexLocator.getIndexForDoc(document).query(document.uri);
  }
}

export class WorkspaceSymbolProvider implements vscode.WorkspaceSymbolProvider {
  constructor(private indexLocator: IndexLocator) { }

  provideWorkspaceSymbols(query: string): vscode.SymbolInformation[] {
    let indices = [...this.indexLocator.allIndices(true)];

    return [].concat(...indices.map((i) => i.query("ALL_FILES", { name: query })));
  }
}