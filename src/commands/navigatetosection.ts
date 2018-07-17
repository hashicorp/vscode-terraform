import * as vscode from "vscode";
import { indexLocator } from "../extension";
import { to_vscode_Range, to_vscode_Uri } from "../index/vscode-adapter";
import { Command } from "./command";

export class NavigateToSectionCommand extends Command {
  constructor() {
    super("navigate-to-section");
  }

  protected async perform(args: { workspaceFolderName: string, targetId: string }): Promise<any> {
    let folder = vscode.workspace.workspaceFolders.find((f) => f.name === args.workspaceFolderName);
    if (!folder) {
      return await vscode.window.showErrorMessage(`Cannot find workspace folder with name ${args.workspaceFolderName}`);
    }

    let index = indexLocator.getIndexForWorkspaceFolder(folder);
    let section = index.section(args.targetId);
    if (!section) {
      return await vscode.window.showErrorMessage(`No section with id ${args.targetId}`);
    }

    await vscode.window.showTextDocument(to_vscode_Uri(section.location.uri), { selection: to_vscode_Range(section.location.range) });
  }
}