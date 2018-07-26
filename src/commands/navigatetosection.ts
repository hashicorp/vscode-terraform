import * as vscode from "vscode";
import { IndexAdapter } from "../index/index-adapter";
import { to_vscode_Range } from "../index/vscode-adapter";
import { Command } from "./command";

export class NavigateToSectionCommand extends Command {
  constructor(private index: IndexAdapter) {
    super("navigate-to-section");
  }

  protected async perform(args: { groupUri: string, targetId: string }): Promise<any> {
    const group = this.index.index.group(args.groupUri);
    if (!group) {
      throw new Error(`Cannot find index group with uri ${args.groupUri}`);
    }

    const section = group.section(args.targetId);
    if (!section) {
      return await vscode.window.showErrorMessage(`No section with id ${args.targetId}`);
    }

    await vscode.window.showTextDocument(
      section.location.uri,
      {
        selection: to_vscode_Range(section.location.range)
      }
    );
  }
}