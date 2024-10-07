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
import { ModuleCallsDataProvider } from '../providers/terraform/moduleCalls';
import { ExperimentalClientCapabilities } from './types';

const CLIENT_MODULE_CALLS_CMD_ID = 'client.refreshModuleCalls';

export class ModuleCallsFeature implements StaticFeature {
  constructor(
    private context: vscode.ExtensionContext,
    private client: BaseLanguageClient,
    private view: ModuleCallsDataProvider,
  ) {}

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  clear(): void {}

  getState(): FeatureState {
    return {
      kind: 'static',
    };
  }

  public fillClientCapabilities(capabilities: ClientCapabilities & ExperimentalClientCapabilities): void {
    if (!capabilities.experimental) {
      capabilities.experimental = {};
    }
    capabilities.experimental.refreshModuleCallsCommandId = CLIENT_MODULE_CALLS_CMD_ID;
  }

  public initialize(capabilities: ServerCapabilities): void {
    this.context.subscriptions.push(vscode.window.registerTreeDataProvider('terraform.modules', this.view));

    if (!capabilities.experimental?.refreshModuleCalls) {
      console.log('Server does not support client.refreshModuleCalls');
      vscode.commands.executeCommand('setContext', 'terraform.modules.supported', false);
      return;
    }

    vscode.commands.executeCommand('setContext', 'terraform.modules.supported', true);

    const d = this.client.onRequest(CLIENT_MODULE_CALLS_CMD_ID, () => {
      this.view.refresh();
    });

    this.context.subscriptions.push(d);

    return;
  }

  public dispose(): void {
    //
  }
}
