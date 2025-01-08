// Copyright (c) The OpenTofu Authors
// SPDX-License-Identifier: MPL-2.0
// Copyright (c) HashiCorp, Inc.
// SPDX-License-Identifier: MPL-2.0

import * as vscode from 'vscode';
import { BaseLanguageClient, ClientCapabilities, FeatureState, StaticFeature } from 'vscode-languageclient';

import { ExperimentalClientCapabilities } from './types';
import * as lsStatus from '../status/language';

export class LanguageStatusFeature implements StaticFeature {
  private disposables: vscode.Disposable[] = [];

  constructor(
    private client: BaseLanguageClient,
    private outputChannel: vscode.OutputChannel,
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
  }

  public initialize(): void {
    this.outputChannel.appendLine('Started client');

    const initializeResult = this.client.initializeResult;
    if (initializeResult === undefined) {
      return;
    }

    lsStatus.setVersion(initializeResult.serverInfo?.version ?? '');
  }

  public dispose(): void {
    this.disposables.forEach((d: vscode.Disposable) => d.dispose());
  }
}
