import * as vscode from 'vscode';
import { BaseLanguageClient, ClientCapabilities, ServerCapabilities, StaticFeature } from 'vscode-languageclient';
import { ModuleProvidersDataProvider } from '../providers/moduleProviders';
import { ExperimentalClientCapabilities } from './types';

export const CLIENT_MODULE_PROVIDERS_CMD_ID = 'client.refreshModuleProviders';

export class ModuleProvidersFeature implements StaticFeature {
  private disposables: vscode.Disposable[] = [];

  constructor(private client: BaseLanguageClient, private view: ModuleProvidersDataProvider) {}

  public fillClientCapabilities(capabilities: ClientCapabilities & ExperimentalClientCapabilities): void {
    if (!capabilities['experimental']) {
      capabilities['experimental'] = {};
    }
    capabilities['experimental']['refreshModuleProvidersCommandId'] = CLIENT_MODULE_PROVIDERS_CMD_ID;
  }

  public async initialize(capabilities: ServerCapabilities): Promise<void> {
    if (!capabilities.experimental?.refreshModuleProviders) {
      console.log("Server doesn't support client.refreshModuleProviders");
      return;
    }

    await this.client.onReady();

    const d = this.client.onRequest(CLIENT_MODULE_PROVIDERS_CMD_ID, () => {
      this.view?.refresh();
    });
    this.disposables.push(d);
  }

  public dispose(): void {
    this.disposables.forEach((d: vscode.Disposable) => d.dispose());
  }
}
