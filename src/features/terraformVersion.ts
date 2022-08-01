import * as terraform from '../terraform';
import * as vscode from 'vscode';
import { ClientCapabilities, ServerCapabilities, StaticFeature } from 'vscode-languageclient';
import { ExperimentalClientCapabilities } from './types';
import TelemetryReporter from '@vscode/extension-telemetry';
import { LanguageClient } from 'vscode-languageclient/node';
import { getActiveTextEditor } from '../utils/vscode';

export const CLIENT_TERRAFORM_VERSION_CMD_ID = 'client.refreshTerraformVersion';

export class TerraformVersionFeature implements StaticFeature {
  private disposables: vscode.Disposable[] = [];

  constructor(private client: LanguageClient, private reporter: TelemetryReporter) {}

  public fillClientCapabilities(capabilities: ClientCapabilities & ExperimentalClientCapabilities): void {
    if (!capabilities['experimental']) {
      capabilities['experimental'] = {};
    }
    capabilities['experimental']['refreshTerraformVersionCommandId'] = CLIENT_TERRAFORM_VERSION_CMD_ID;
  }

  public async initialize(capabilities: ServerCapabilities): Promise<void> {
    if (!capabilities.experimental?.refreshTerraformVersion) {
      console.log("Server doesn't support client.refreshTerraformVersion");
      return;
    }

    await this.client.onReady();

    const d = this.client.onRequest(CLIENT_TERRAFORM_VERSION_CMD_ID, async () => {
      const editor = getActiveTextEditor();
      if (editor === undefined) {
        return;
      }

      terraform.getTerraformVersion(editor.document.uri, this.client, this.reporter);
    });

    this.disposables.push(d);
  }

  public dispose(): void {
    this.disposables.forEach((d: vscode.Disposable) => d.dispose());
  }
}
