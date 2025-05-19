/**
 * Copyright (c) HashiCorp, Inc.
 * SPDX-License-Identifier: MPL-2.0
 */

import * as vscode from 'vscode';
import TelemetryReporter from '@vscode/extension-telemetry';
import {
  BaseLanguageClient,
  ClientCapabilities,
  DocumentSelector,
  FeatureState,
  InitializeParams,
  ServerCapabilities,
  StaticFeature,
} from 'vscode-languageclient';

import { ExperimentalClientCapabilities } from './types';

const TELEMETRY_VERSION = 1;

/*
This interface is unused at the moment. Commenting instead of removing in case we need it in future
interface TelemetryEvent {
  v: number;
  name: string;
  properties: Record<string, unknown>;
}
 */
export class TelemetryFeature implements StaticFeature {
  constructor(
    private context: vscode.ExtensionContext,
    private client: BaseLanguageClient,
    private reporter: TelemetryReporter,
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
    capabilities.experimental.telemetryVersion = TELEMETRY_VERSION;
  }

  public initialize(): void {
    if (!vscode.env.isTelemetryEnabled) {
      return;
    }
  }

  public dispose(): void {
    //
  }
}
