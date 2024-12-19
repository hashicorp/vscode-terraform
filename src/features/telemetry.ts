/**
 * Copyright (c) HashiCorp, Inc.
 * SPDX-License-Identifier: MPL-2.0
 */

import * as vscode from 'vscode';
import TelemetryReporter from '@vscode/extension-telemetry';
import { BaseLanguageClient, ClientCapabilities, FeatureState, StaticFeature } from 'vscode-languageclient';

import { ExperimentalClientCapabilities } from './types';

const TELEMETRY_VERSION = 1;

interface TelemetryEvent {
  v: number;
  name: string;
  properties: Record<string, unknown>;
}

export class TelemetryFeature implements StaticFeature {
  constructor(
    private context: vscode.ExtensionContext,
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
    if (!capabilities.experimental) {
      capabilities.experimental = {};
    }
    capabilities.experimental.telemetryVersion = TELEMETRY_VERSION;
  }

  public initialize(): void {
    if (!vscode.env.isTelemetryEnabled) {
      return;
    }

    this.context.subscriptions.push(
      this.client.onTelemetry((event: TelemetryEvent) => {
        if (event.v !== TELEMETRY_VERSION) {
          console.log(`unsupported telemetry event: ${event.name}`);
          return;
        }

        const thing: Record<string, string> = {};
        for (const [key, value] of Object.entries(event.properties)) {
          thing[key] = String(value);
        }
        this.reporter.sendRawTelemetryEvent(event.name, thing);
      }),
    );
  }

  public dispose(): void {
    //
  }
}
