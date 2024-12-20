/**
 * Copyright (c) HashiCorp, Inc.
 * SPDX-License-Identifier: MPL-2.0
 */

import TelemetryReporter from '@vscode/extension-telemetry';
import * as vscode from 'vscode';

const brand = `HashiCorp Terraform`;
const outputChannel = vscode.window.createOutputChannel(brand);
let reporter: TelemetryReporter;

export function activate(context: vscode.ExtensionContext) {
  const manifest = context.extension.packageJSON;
  reporter = new TelemetryReporter(manifest.appInsightsKey);
  context.subscriptions.push(reporter);
  context.subscriptions.push(outputChannel);

  reporter.sendTelemetryEvent('startExtension');
  outputChannel.appendLine(`Started: Terraform ${vscode.env.appHost}`);
}

export function deactivate() {
  reporter.sendTelemetryEvent('stopExtension');
  outputChannel.appendLine(`Stopped: Terraform ${vscode.env.appHost}`);
}
