// Copyright (c) The OpenTofu Authors
// SPDX-License-Identifier: MPL-2.0
// Copyright (c) HashiCorp, Inc.
// SPDX-License-Identifier: MPL-2.0

import * as vscode from 'vscode';
import {
  BaseLanguageClient,
  ClientCapabilities,
  FeatureState,
  ServerCapabilities,
  StaticFeature,
} from 'vscode-languageclient';
import { ModuleProvidersDataProvider } from '../providers/terraform/moduleProviders';
import { ExperimentalClientCapabilities } from './types';

export const CLIENT_MODULE_PROVIDERS_CMD_ID = 'client.refreshModuleProviders';

export class ModuleProvidersFeature implements StaticFeature {
  private disposables: vscode.Disposable[] = [];

  constructor(
    private client: BaseLanguageClient,
    private view: ModuleProvidersDataProvider,
  ) {}

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  clear(): void {}

  getState(): FeatureState {
    return {
      kind: 'static',
    };
  }

  public fillClientCapabilities(capabilities: ClientCapabilities & ExperimentalClientCapabilities): void {
    if (!capabilities['experimental']) {
      capabilities['experimental'] = {};
    }
    capabilities['experimental']['refreshModuleProvidersCommandId'] = CLIENT_MODULE_PROVIDERS_CMD_ID;
  }

  public async initialize(capabilities: ServerCapabilities): Promise<void> {
    this.disposables.push(vscode.window.registerTreeDataProvider('opentofu.providers', this.view));

    if (!capabilities.experimental?.refreshModuleProviders) {
      console.log("Server doesn't support client.refreshModuleProviders");
      await vscode.commands.executeCommand('setContext', 'terraform.providers.supported', false);
      return;
    }

    await vscode.commands.executeCommand('setContext', 'terraform.providers.supported', true);

    const d = this.client.onRequest(CLIENT_MODULE_PROVIDERS_CMD_ID, () => {
      this.view?.refresh();
    });
    this.disposables.push(d);
  }

  public dispose(): void {
    this.disposables.forEach((d: vscode.Disposable) => d.dispose());
  }
}
