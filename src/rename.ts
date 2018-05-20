import * as vscode from 'vscode';
import { Index } from './index';
import { IndexLocator } from './index/index-locator';

export class RenameProvider implements vscode.RenameProvider {
  constructor(private indexLocator: IndexLocator) { }

  provideRenameEdits(document: vscode.TextDocument, position: vscode.Position, newName: string): vscode.WorkspaceEdit {
    let index = this.indexLocator.getIndexForDoc(document);
    let section = index.query(document.uri, { name_position: position })[0];
    if (!section) {
      return null;
    }

    let references = index.queryReferences("ALL_FILES", { target: section });
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