import * as vscode from "vscode";
import { indexLocator } from "../extension";
import { Command } from "./command";

export class IndexCommand extends Command {
  constructor() {
    super("index-document");
  }

  protected async perform(uri: vscode.Uri): Promise<boolean> {
    let doc = vscode.workspace.textDocuments.find((d) => d.uri.toString() === uri.toString());
    if (!doc) {
      await vscode.window.showErrorMessage(`No open document with uri ${uri.toString()} found`);
      return false;
    }

    let index = indexLocator.getIndexForUri(uri);
    return !!index.indexDocument(doc);
  }
}