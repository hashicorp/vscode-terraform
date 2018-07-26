import * as vscode from 'vscode';
import { IndexAdapter } from './index/index-adapter';
import { from_vscode_Position, to_vscode_Location } from './index/vscode-adapter';
import { Logger } from './logger';
import { Reporter } from './telemetry';

export class DefinitionProvider implements vscode.DefinitionProvider {
  private logger = new Logger("definition-provider");

  constructor(private index: IndexAdapter) { }

  provideDefinition(document: vscode.TextDocument, position: vscode.Position): vscode.Location {
    try {
      let [file, group] = this.index.indexDocument(document);
      if (!file || !group)
        return null;

      let reference = group.queryReferences(document.uri, { position: from_vscode_Position(position) })[0];
      if (!reference)
        return null;

      let section = group.query("ALL_FILES", { id: reference.targetId })[0];
      if (!section)
        return null;
      return to_vscode_Location(section.location);
    } catch (error) {
      this.logger.exception("Could not provide definition", error);
      Reporter.trackException("provideDefinition", error);
    }
  }
}
