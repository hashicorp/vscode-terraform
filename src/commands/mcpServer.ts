/**
 * Copyright (c) HashiCorp, Inc.
 * SPDX-License-Identifier: MPL-2.0
 */

import * as vscode from 'vscode';
import { config, getScope } from '../utils/vscode';

export class McpServerCommands implements vscode.Disposable {
  constructor(private context: vscode.ExtensionContext) {
    this.context.subscriptions.push(
      vscode.commands.registerCommand('terraform.enableMcpServer', async () => {
        if (config('terraform').get('mcp.server.enabled') === true) {
          return;
        }

        const scope: vscode.ConfigurationTarget = getScope('terraform', 'mcp.server.enabled');
        await config('terraform').update('mcp.server.enabled', true, scope);
      }),
      vscode.commands.registerCommand('terraform.disableMcpServer', async () => {
        if (config('terraform').get('mcp.server.enabled') === false) {
          return;
        }

        const scope: vscode.ConfigurationTarget = getScope('terraform', 'mcp.server.enabled');
        await config('terraform').update('mcp.server.enabled', false, scope);
      }),
    );
  }

  dispose(): void {
    // context.subscriptions will be disposed by the extension, so any explicit code should not be required.
  }
}
