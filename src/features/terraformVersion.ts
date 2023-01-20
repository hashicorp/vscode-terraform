import * as vscode from 'vscode';
import * as terraform from '../terraform';
import { ClientCapabilities, ServerCapabilities, StaticFeature } from 'vscode-languageclient';
import { getActiveTextEditor } from '../utils/vscode';
import { ExperimentalClientCapabilities } from './types';
import { Utils } from 'vscode-uri';
import TelemetryReporter from '@vscode/extension-telemetry';
import { LanguageClient } from 'vscode-languageclient/node';

export class TerraformVersionFeature implements StaticFeature {
  private disposables: vscode.Disposable[] = [];

  private clientTerraformVersionCommandId = 'client.refreshTerraformVersion';

  private installedVersion = vscode.languages.createLanguageStatusItem('terraform.installedVersion', [
    { language: 'terraform' },
    { language: 'terraform-vars' },
  ]);
  private requiredVersion = vscode.languages.createLanguageStatusItem('terraform.requiredVersion', [
    { language: 'terraform' },
    { language: 'terraform-vars' },
  ]);

  constructor(
    private client: LanguageClient,
    private reporter: TelemetryReporter,
    private outputChannel: vscode.OutputChannel,
  ) {
    this.installedVersion.name = 'TerraformInstalledVersion';
    this.installedVersion.detail = 'Installed Version';

    this.requiredVersion.name = 'TerraformRequiredVersion';
    this.requiredVersion.detail = 'Required Version';

    this.disposables.push(this.installedVersion);
    this.disposables.push(this.requiredVersion);
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

    await this.client.onReady();

    const handler = this.client.onRequest(this.clientTerraformVersionCommandId, async () => {
      const editor = getActiveTextEditor();
      if (editor === undefined) {
        return;
      }

      const moduleDir = Utils.dirname(editor.document.uri);

      try {
        const response = await terraform.terraformVersion(moduleDir.toString(), this.client, this.reporter);
        this.installedVersion.text = response.discovered_version || 'N/A';
        this.requiredVersion.text = response.required_version || 'N/A';
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
