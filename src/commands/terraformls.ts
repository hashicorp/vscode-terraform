/**
 * Copyright (c) HashiCorp, Inc.
 * SPDX-License-Identifier: MPL-2.0
 */

import * as vscode from 'vscode';
import { config, getScope } from '../utils/vscode';

export class TerraformLSCommands implements vscode.Disposable {
  private commands: vscode.Disposable[];

  constructor() {
    this.commands = [
      vscode.workspace.onDidChangeConfiguration(async (event: vscode.ConfigurationChangeEvent) => {
        if (event.affectsConfiguration('terraform') || event.affectsConfiguration('terraform-ls')) {
          const reloadMsg = 'Reload VSCode window to apply language server changes';
          const selected = await vscode.window.showInformationMessage(reloadMsg, 'Reload');
          if (selected === 'Reload') {
            vscode.commands.executeCommand('workbench.action.reloadWindow');
          }
        }
      }),
      vscode.commands.registerCommand('terraform.enableLanguageServer', async () => {
        if (config('terraform').get('languageServer.enable') === true) {
          return;
        }

        const scope: vscode.ConfigurationTarget = getScope('terraform', 'languageServer.enable');

        await config('terraform').update('languageServer.enable', true, scope);
      }),
      vscode.commands.registerCommand('terraform.disableLanguageServer', async () => {
        if (config('terraform').get('languageServer.enable') === false) {
          return;
        }

        const scope: vscode.ConfigurationTarget = getScope('terraform', 'languageServer.enable');

        await config('terraform').update('languageServer.enable', false, scope);
      }),
      vscode.commands.registerCommand('terraform.openSettingsJson', async () => {
        // this opens the default settings window (either UI or json)
        await vscode.commands.executeCommand('workbench.action.openSettings', {
          revealSetting: { key: 'terraform.languageServer.enable', edit: true },
        });
      }),
    ];
  }

  dispose() {
    this.commands.forEach((c) => c.dispose());
  }
}
