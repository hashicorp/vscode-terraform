import * as vscode from "vscode";
import { IndexAdapter } from "../index/index-adapter";
import { Command } from "./command";

export class IndexCommand extends Command {
  constructor(private index: IndexAdapter) {
    super("index-document");
  }

  protected async perform(uri: vscode.Uri): Promise<boolean> {
    let doc = vscode.workspace.textDocuments.find((d) => d.uri.toString() === uri.toString());
    if (!doc) {
      await vscode.window.showErrorMessage(`No open document with uri ${uri.toString()} found`);
      return false;
    }

    let [file, group] = this.index.indexDocument(doc);
    return !!file && !!group;
  }
}