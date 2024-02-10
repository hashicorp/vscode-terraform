/**
 * Copyright (c) HashiCorp, Inc.
 * SPDX-License-Identifier: MPL-2.0
 */

import * as vscode from 'vscode';

const brand = `HashiCorp Terraform`;
const outputChannel = vscode.window.createOutputChannel(brand);

export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(outputChannel);

  outputChannel.appendLine(`Started: Terraform ${vscode.env.appHost}`);
}

export function deactivate() {
  outputChannel.appendLine(`Stopped: Terraform ${vscode.env.appHost}`);
}
