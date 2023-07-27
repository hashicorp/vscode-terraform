/**
 * Copyright (c) HashiCorp, Inc.
 * SPDX-License-Identifier: MPL-2.0
 */

import * as vscode from 'vscode';
import * as terraform from '../terraform';
import { ClientCapabilities, FeatureState, ServerCapabilities, StaticFeature } from 'vscode-languageclient';
import { getActiveTextEditor } from '../utils/vscode';
import { ExperimentalClientCapabilities } from './types';
import { Utils } from 'vscode-uri';
import TelemetryReporter from '@vscode/extension-telemetry';
import { LanguageClient } from 'vscode-languageclient/node';
import * as lsStatus from '../status/language';
import * as versionStatus from '../status/installedVersion';
import * as requiredVersionStatus from '../status/requiredVersion';

export class TerraformVersionFeature implements StaticFeature {
  private disposables: vscode.Disposable[] = [];

  private clientTerraformVersionCommandId = 'client.refreshTerraformVersion';

  constructor(
    private client: LanguageClient,
    private reporter: TelemetryReporter,
    private outputChannel: vscode.OutputChannel,
  ) {}

  getState(): FeatureState {
    return {
      kind: 'static',
    };
  }

  public fillClientCapabilities(capabilities: ClientCapabilities & ExperimentalClientCapabilities): void {
    capabilities.experimental = capabilities.experimental || {};
    capabilities.experimental.refreshTerraformVersionCommandId = this.clientTerraformVersionCommandId;
  }

  public async initialize(capabilities: ServerCapabilities): Promise<void> {
    if (!capabilities.experimental?.refreshTerraformVersion) {
      this.outputChannel.appendLine("Server doesn't support client.refreshTerraformVersion");
      return;
    }

    const handler = this.client.onRequest(this.clientTerraformVersionCommandId, async () => {
      const editor = getActiveTextEditor();
      if (editor === undefined) {
        return;
      }

      const moduleDir = Utils.dirname(editor.document.uri);

      try {
        versionStatus.Waiting();
        requiredVersionStatus.Waiting();

        lsStatus.setLanguageServerBusy();

        const response = await terraform.terraformVersion(moduleDir.toString(), this.client, this.reporter);
        versionStatus.setVersion(response.discovered_version || 'unknown');
        requiredVersionStatus.setVersion(response.required_version || 'any');

        lsStatus.setLanguageServerRunning();
        versionStatus.Ready();
        requiredVersionStatus.Ready();
      } catch (error) {
        let message = 'Unknown Error';
        if (error instanceof Error) {
          message = error.message;
        } else if (typeof error === 'string') {
          message = error;
        }

        /*
         We do not want to pop an error window because the user cannot do anything
         at this point. An error here likely means we cannot communicate with the LS,
         which means it's already shut down.
         Instead we log to the outputchannel so when the user copies the log we can
         see this errored here.
        */
        this.outputChannel.appendLine(message);

        lsStatus.setLanguageServerRunning();
        versionStatus.Ready();
        requiredVersionStatus.Ready();
      }
    });

    this.disposables.push(handler);
  }

  public dispose(): void {
    this.disposables.forEach((d: vscode.Disposable, index, things) => {
      d.dispose();
      things.splice(index, 1);
    });
  }
}
