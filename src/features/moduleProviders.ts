/**
 * Copyright (c) HashiCorp, Inc.
 * SPDX-License-Identifier: MPL-2.0
 */

import * as vscode from 'vscode';
import {
  BaseLanguageClient,
  ClientCapabilities,
  DocumentSelector,
  FeatureState,
  InitializeParams,
  ServerCapabilities,
  StaticFeature,
} from 'vscode-languageclient';
import { ModuleProvidersDataProvider } from '../providers/terraform/moduleProviders';
import { ExperimentalClientCapabilities } from './types';

export const CLIENT_MODULE_PROVIDERS_CMD_ID = 'client.refreshModuleProviders';

export class ModuleProvidersFeature implements StaticFeature {
  constructor(
    private context: vscode.ExtensionContext,
    private client: BaseLanguageClient,
    private view: ModuleProvidersDataProvider,
  ) {}
  fillInitializeParams?: ((params: InitializeParams) => void) | undefined;
  preInitialize?:
    | ((capabilities: ServerCapabilities, documentSelector: DocumentSelector | undefined) => void)
    | undefined;

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  clear(): void {}

  getState(): FeatureState {
    return { kind: 'static' };
  }

  public fillClientCapabilities(capabilities: ClientCapabilities & ExperimentalClientCapabilities): void {
    capabilities.experimental ??= {};
    capabilities.experimental.refreshModuleProvidersCommandId = CLIENT_MODULE_PROVIDERS_CMD_ID;
  }

  public initialize(capabilities: ServerCapabilities): void {
    this.context.subscriptions.push(vscode.window.registerTreeDataProvider('terraform.providers', this.view));

    if (!capabilities.experimental?.refreshModuleProviders) {
      console.log("Server doesn't support client.refreshModuleProviders");
      vscode.commands.executeCommand('setContext', 'terraform.providers.supported', false);
      return;
    }

    const d = this.client.onRequest(CLIENT_MODULE_PROVIDERS_CMD_ID, () => {
      this.view.refresh();
    });
    this.context.subscriptions.push(d);
  }

  public dispose(): void {
    //
  }
}
