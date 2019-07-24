import * as vscode from "vscode";
import { IndexAdapter } from "../index/index-adapter";
import { Command, CommandType } from "./command";
import { getConfiguration } from "../configuration";
import { ExperimentalLanguageClient } from "../languageclient";
import * as _ from "lodash";

export class ToggleLanguageServerCommand extends Command {
  public static readonly CommandName = "toggleLanguageServer";

  constructor(ctx: vscode.ExtensionContext) {
    super(ToggleLanguageServerCommand.CommandName, ctx, CommandType.PALETTE);
  }

  protected async perform(prompt: boolean = true): Promise<boolean> {
    // Disable indexing
    let indexConfig = _.clone(getConfiguration().indexing);
    indexConfig.enabled = !indexConfig.enabled;

    // Enable LSP
    let langServerConfig = _.clone(getConfiguration().languageServer);
    langServerConfig.enabled = !langServerConfig.enabled;

    // Update config
    await vscode.workspace.getConfiguration().update("terraform.indexing", indexConfig, vscode.ConfigurationTarget.Global);
    await vscode.workspace.getConfiguration().update("terraform.languageServer", langServerConfig, vscode.ConfigurationTarget.Global);

    // Reload the window to start the server
    await ExperimentalLanguageClient.reloadWindow(false);

    return true;
  }
}