/**
 * Copyright (c) HashiCorp, Inc.
 * SPDX-License-Identifier: MPL-2.0
 */

import * as vscode from 'vscode';
import { TerraformCloudAuthenticationProvider } from '../../../providers/authenticationProvider';

suite.only('workspaces', () => {
  let extensionContext: vscode.ExtensionContext;

  suiteSetup(async () => {
    // Trigger extension activation and grab the context as some tests depend on it
    await vscode.extensions.getExtension('vscode.vscode-api-tests')?.activate();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    extensionContext = (global as any).testExtensionContext;
  });

  test('workspace project filter', async () => {
    extensionContext.secrets.store(TerraformCloudAuthenticationProvider.providerID, JSON.stringify({ id: 'test' }));
    await extensionContext.workspaceState.update('terraform.cloud.organization', 'test');

    await vscode.commands.executeCommand('workbench.view.extension.terraform-cloud');
    await vscode.commands.executeCommand('terraform.cloud.workspaces.filterByProject');
    // await commands.executeCommand('workbench.action.quickOpenSelectNext');
    // await commands.executeCommand('workbench.action.acceptSelectedQuickOpenItem');
  });
});
