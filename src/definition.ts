import * as vscode from 'vscode';
import { Index } from './index';
import { IndexLocator } from './index/index-locator';

export class DefinitionProvider implements vscode.DefinitionProvider {
  constructor(private indexLocator: IndexLocator) { }

  provideDefinition(document: vscode.TextDocument, position: vscode.Position): vscode.Location {
    let reference = this.indexLocator.getIndexForDoc(document).queryReferences(document.uri, { position: position })[0];
    if (!reference)
      return null;

    let section = this.indexLocator.getIndexForDoc(document).query("ALL_FILES", reference.getQuery())[0];
    if (!section)
      return null;
    return section.location;
  }
}
