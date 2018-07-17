import * as vscode from 'vscode';
import { IndexLocator } from './index/index-locator';
import { from_vscode_Position, from_vscode_Uri, to_vscode_Location } from './index/vscode-adapter';
import { Logger } from './logger';
import { Reporter } from './telemetry';

export class DefinitionProvider implements vscode.DefinitionProvider {
  private logger = new Logger("definition-provider");

  constructor(private indexLocator: IndexLocator) { }

  provideDefinition(document: vscode.TextDocument, position: vscode.Position): vscode.Location {
    try {
      let reference = this.indexLocator.getIndexForDoc(document).queryReferences(from_vscode_Uri(document.uri), { position: from_vscode_Position(position) })[0];
      if (!reference)
        return null;

      let section = this.indexLocator.getIndexForDoc(document).query("ALL_FILES", { id: reference.targetId })[0];
      if (!section)
        return null;
      return to_vscode_Location(section.location);
    } catch (error) {
      this.logger.exception("Could not provide definition", error);
      Reporter.trackException("provideDefinition", error);
    }
  }
}
