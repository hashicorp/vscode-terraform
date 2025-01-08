// Copyright (c) The OpenTofu Authors
// SPDX-License-Identifier: MPL-2.0
// Copyright (c) HashiCorp, Inc.
// SPDX-License-Identifier: MPL-2.0

import * as vscode from 'vscode';

const brand = `OpenTofu`;
const outputChannel = vscode.window.createOutputChannel(brand);

export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(outputChannel);

  outputChannel.appendLine(`Started: OpenTofu ${vscode.env.appHost}`);
}

export function deactivate() {
  outputChannel.appendLine(`Stopped: OpenTofu ${vscode.env.appHost}`);
}
