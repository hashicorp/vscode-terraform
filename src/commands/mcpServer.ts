/**
 * Copyright IBM Corp. 2026
 * SPDX-License-Identifier: MPL-2.0
 */

import * as vscode from 'vscode';
import { config, getScope } from '../utils/vscode';

export class McpServerCommands implements vscode.Disposable {
  constructor(private context: vscode.ExtensionContext) {
    this.context.subscriptions.push(
      vscode.commands.registerCommand('terraform.enableMcpServer', async () => {
        if (config('terraform').get<boolean>('mcp.server.enable') === true) {
          return;
        }

        const scope: vscode.ConfigurationTarget = getScope('terraform', 'mcp.server.enable');
        await config('terraform').update('mcp.server.enable', true, scope);
      }),
      vscode.commands.registerCommand('terraform.disableMcpServer', async () => {
        if (config('terraform').get<boolean>('mcp.server.enable') === false) {
          return;
        }

        const scope: vscode.ConfigurationTarget = getScope('terraform', 'mcp.server.enable');
        await config('terraform').update('mcp.server.enable', false, scope);
      }),
    );
  }

  dispose(): void {
    // context.subscriptions will be disposed by the extension, so any explicit code should not be required.
  }
}
