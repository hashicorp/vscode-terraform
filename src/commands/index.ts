import * as vscode from "vscode";
import { IndexAdapter } from "../index/index-adapter";
import { Command, CommandType } from "./command";

export class IndexCommand extends Command {
  public static readonly CommandName = "index-document";

  constructor(private index: IndexAdapter, ctx: vscode.ExtensionContext) {
    super(IndexCommand.CommandName, ctx, CommandType.INTERNAL);
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