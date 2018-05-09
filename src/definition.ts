import * as vscode from 'vscode';
import { Index } from './index';

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
