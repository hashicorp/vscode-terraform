import * as vscode from 'vscode';
import { IndexLocator } from './index/index-locator';
import { from_vscode_Position, from_vscode_Uri, to_vscode_Range, to_vscode_Uri } from './index/vscode-adapter';

export class RenameProvider implements vscode.RenameProvider {
  constructor(private indexLocator: IndexLocator) { }

  provideRenameEdits(document: vscode.TextDocument, position: vscode.Position, newName: string): vscode.WorkspaceEdit {
    let index = this.indexLocator.getIndexForDoc(document);
    let section = index.query(from_vscode_Uri(document.uri), { name_position: from_vscode_Position(position) })[0];
    if (!section) {
      return null;
    }

    let references = index.queryReferences("ALL_FILES", { target: section });
    if (references.length === 0) {
      return null;
    }

    let edit = new vscode.WorkspaceEdit;
    edit.replace(document.uri, to_vscode_Range(section.nameLocation.range), newName);

    const oldId = section.id();
    const newId = section.id(newName);
    references.forEach((reference) => {
      if (!reference.nameRange) {
        // references in .tf
        const range = to_vscode_Range(reference.location.range);
        const end = range.end.with({ character: range.start.character + oldId.length });
        edit.replace(to_vscode_Uri(reference.location.uri), range.with({ end: end }), newId);
      } else {
        // references in .tfvars
        edit.replace(to_vscode_Uri(reference.location.uri), to_vscode_Range(reference.nameRange), newName);
      }
    });
    return edit;
  }
}