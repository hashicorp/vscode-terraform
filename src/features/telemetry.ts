/**
 * Copyright (c) HashiCorp, Inc.
 * SPDX-License-Identifier: MPL-2.0
 */

import * as vscode from 'vscode';
import TelemetryReporter from '@vscode/extension-telemetry';
import { BaseLanguageClient, ClientCapabilities, FeatureState, StaticFeature } from 'vscode-languageclient';

import { ExperimentalClientCapabilities } from './types';

const TELEMETRY_VERSION = 1;

type TelemetryEvent = {
  v: number;
  name: string;
  properties: { [key: string]: unknown };
};

export class TelemetryFeature implements StaticFeature {
  private disposables: vscode.Disposable[] = [];

  constructor(
    private client: BaseLanguageClient,
    private reporter: TelemetryReporter,
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
    capabilities['experimental']['telemetryVersion'] = TELEMETRY_VERSION;
  }

  public initialize(): void {
    if (vscode.env.isTelemetryEnabled === false) {
      return;
    }

    this.disposables.push(
      this.client.onTelemetry((event: TelemetryEvent) => {
        if (event.v !== TELEMETRY_VERSION) {
          console.log(`unsupported telemetry event: ${event}`);
          return;
        }

        this.reporter.sendRawTelemetryEvent(event.name, event.properties);
      }),
    );
  }

  public dispose(): void {
    this.disposables.forEach((d: vscode.Disposable) => d.dispose());
  }
}
