import * as vscode from 'vscode';
import { IndexAdapter } from './index/index-adapter';
import { from_vscode_Position, from_vscode_Uri, to_vscode_Range, to_vscode_Uri } from './index/vscode-adapter';
import { Logger } from './logger';
import { Reporter } from './telemetry';

export class RenameProvider implements vscode.RenameProvider {
  private logger = new Logger("rename-provider");

  constructor(private index: IndexAdapter) { }

  provideRenameEdits(document: vscode.TextDocument, position: vscode.Position, newName: string): vscode.WorkspaceEdit {
    try {
      let [file, group] = this.index.indexDocument(document);
      if (!file || !group)
        return null;

      let section = group.query(from_vscode_Uri(document.uri), { name_position: from_vscode_Position(position) })[0];
      if (!section) {
        Reporter.trackEvent("provideRenameEdits", { sectionType: "$null" });
        return null;
      }

      let references = group.queryReferences("ALL_FILES", { target: section });
      if (references.length === 0) {
        Reporter.trackEvent("provideRenameEdits", { sectionType: section.sectionType }, { references: 0 });
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
      Reporter.trackEvent("provideRenameEdits", { sectionType: section.sectionType }, { references: references.length });
      return edit;
    } catch (err) {
      this.logger.exception("Could not provide rename edits", err);
      Reporter.trackException("provideRenameEdits", err);
    }
  }
}