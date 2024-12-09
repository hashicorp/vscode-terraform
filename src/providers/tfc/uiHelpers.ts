/**
 * Copyright (c) HashiCorp, Inc.
 * SPDX-License-Identifier: MPL-2.0
 */

import { ZodiosError } from '@zodios/core';
import * as vscode from 'vscode';
import { TerraformCloudAuthenticationProvider } from './authenticationProvider';
import TelemetryReporter from '@vscode/extension-telemetry';

export interface APIResource {
  readonly name: string;

  readonly title: string;
  readonly placeholder: string;
  readonly ignoreFocusOut?: boolean;

  fetchItems(query?: string): Promise<vscode.QuickPickItem[]>;
}

export class APIQuickPick {
  private quickPick: vscode.QuickPick<vscode.QuickPickItem>;
  private fetchTimerKey: NodeJS.Timeout | undefined;

  constructor(private resource: APIResource) {
    this.quickPick = vscode.window.createQuickPick();
    this.quickPick.title = resource.title;
    this.quickPick.placeholder = resource.placeholder;
    // eslint-disable-next-line @typescript-eslint/unbound-method
    this.quickPick.onDidChangeValue(this.onDidChangeValue, this);
    this.quickPick.ignoreFocusOut = resource.ignoreFocusOut ?? false;
  }

  private onDidChangeValue() {
    clearTimeout(this.fetchTimerKey);
    // Only starts fetching after a user stopped typing for 300ms
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    this.fetchTimerKey = setTimeout(() => this.fetchResource.apply(this), 300);
  }

  private async fetchResource() {
    this.quickPick.busy = true;
    this.quickPick.show();

    this.quickPick.items = await this.resource.fetchItems(this.quickPick.value);

    this.quickPick.busy = false;
  }

  async pick(autoHide = true) {
    await this.fetchResource();

    const result = await new Promise<vscode.QuickPickItem | undefined>((resolve) => {
      this.quickPick.onDidAccept(() => {
        resolve(this.quickPick.selectedItems[0]);
      });

      this.quickPick.onDidHide(() => {
        resolve(undefined);
      });
    });

    if (autoHide) {
      this.quickPick.hide();
    }

    return result;
  }

  hide() {
    this.quickPick.hide();
  }

  dispose() {
    this.quickPick.dispose();
  }
}

export async function handleZodiosError(
  error: ZodiosError,
  msgPrefix: string,
  outputChannel: vscode.OutputChannel,
  reporter: TelemetryReporter,
) {
  reporter.sendTelemetryErrorEvent('zodiosError', {
    message: error.message,
    stack: error.stack,
  });
  outputChannel.append(JSON.stringify({ cause: error.cause }, undefined, 2));
  const chosenItem = await vscode.window.showErrorMessage(
    `${msgPrefix} Response validation failed. Please report this as a bug.`,
    'Report bug',
  );
  if (chosenItem === 'Report bug') {
    outputChannel.show(true);
    vscode.commands.executeCommand('terraform.generateBugReport');
    return;
  }
}

export async function handleAuthError() {
  // TODO: clear org
  await vscode.authentication.getSession(TerraformCloudAuthenticationProvider.providerID, [], {
    createIfNone: false,
    forceNewSession: {
      detail: 'Your token is invalid or has expired. Please generate a new token',
    },
  });
}
