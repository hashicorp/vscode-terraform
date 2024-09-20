/**
 * Copyright (c) HashiCorp, Inc.
 * SPDX-License-Identifier: MPL-2.0
 */

import TelemetryReporter from '@vscode/extension-telemetry';
import * as vscode from 'vscode';
import { LanguageClient } from 'vscode-languageclient/node';
import * as terraform from '../api/terraform/terraform';

export class TerraformCommands implements vscode.Disposable {
  constructor(
    private client: LanguageClient,
    private reporter: TelemetryReporter,
    private context: vscode.ExtensionContext,
  ) {
    this.context.subscriptions.push(
      vscode.commands.registerCommand('terraform.init', async () => {
        await terraform.initAskUserCommand(this.client, this.reporter);
      }),
      vscode.commands.registerCommand('terraform.initCurrent', async () => {
        await terraform.initCurrentOpenFileCommand(this.client, this.reporter);
      }),
      vscode.commands.registerCommand('terraform.apply', async () => {
        await terraform.command('apply', this.client, this.reporter, true);
      }),
      vscode.commands.registerCommand('terraform.plan', async () => {
        await terraform.command('plan', this.client, this.reporter, true);
      }),
      vscode.commands.registerCommand('terraform.validate', async () => {
        await terraform.command('validate', this.client, this.reporter);
      }),
    );
  }

  dispose() {
    //
  }
}
