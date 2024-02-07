/**
 * Copyright (c) HashiCorp, Inc.
 * SPDX-License-Identifier: MPL-2.0
 */

import * as vscode from 'vscode';
import {
  BaseLanguageClient,
  ClientCapabilities,
  FeatureState,
  ServerCapabilities,
  StaticFeature,
} from 'vscode-languageclient';
import { ModuleCallsDataProvider } from '../providers/moduleCalls';
import { ExperimentalClientCapabilities } from './types';

const CLIENT_MODULE_CALLS_CMD_ID = 'client.refreshModuleCalls';

export class ModuleCallsFeature implements StaticFeature {
  private disposables: vscode.Disposable[] = [];

  constructor(private client: BaseLanguageClient, private view: ModuleCallsDataProvider) {}

  getState(): FeatureState {
    return {
      kind: 'static',
    };
  }

  public fillClientCapabilities(capabilities: ClientCapabilities & ExperimentalClientCapabilities): void {
    if (!capabilities['experimental']) {
      capabilities['experimental'] = {};
    }
    capabilities['experimental']['refreshModuleCallsCommandId'] = CLIENT_MODULE_CALLS_CMD_ID;
  }

  public async initialize(capabilities: ServerCapabilities): Promise<void> {
    this.disposables.push(vscode.window.registerTreeDataProvider('terraform.modules', this.view));

    if (!capabilities.experimental?.refreshModuleCalls) {
      console.log('Server does not support client.refreshModuleCalls');
      await vscode.commands.executeCommand('setContext', 'terraform.modules.supported', false);
      return;
    }

    await vscode.commands.executeCommand('setContext', 'terraform.modules.supported', true);

    const d = this.client.onRequest(CLIENT_MODULE_CALLS_CMD_ID, () => {
      this.view?.refresh();
    });
    this.disposables.push(d);
  }

  public dispose(): void {
    this.disposables.forEach((d: vscode.Disposable) => d.dispose());
  }
}
