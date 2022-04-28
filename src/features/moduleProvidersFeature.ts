import * as vscode from 'vscode';
import { BaseLanguageClient, ClientCapabilities, ServerCapabilities, StaticFeature } from 'vscode-languageclient';
import { ModuleProvidersDataProvider } from '../providers/moduleProviders';
import { ExperimentalClientCapabilities } from './types';

export const CLIENT_MODULE_PROVIDERS_CMD_ID = 'client.refreshModuleProviders';

export class ModuleProvidersFeature implements StaticFeature {
  private registeredCommands: vscode.Disposable[] = [];

  constructor(private client: BaseLanguageClient, private moduleProviderView: ModuleProvidersDataProvider) {}

  public fillClientCapabilities(capabilities: ClientCapabilities & ExperimentalClientCapabilities): void {
    if (!capabilities['experimental']) {
      capabilities['experimental'] = {};
    }
    capabilities['experimental']['refereshModuleProvidersCommandId'] = CLIENT_MODULE_PROVIDERS_CMD_ID;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public async initialize(capabilities: ServerCapabilities): Promise<void> {
    console.log('Initializing client.refreshModuleProviders');
    if (!capabilities.experimental?.refreshModuleProviders) {
      console.log('Server doesnt support client.refreshModuleProviders');
      return;
    }

    console.log('Enabled client.refreshModuleProviders');

    await this.client.onReady();

    this.client.onRequest(CLIENT_MODULE_PROVIDERS_CMD_ID, () => {
      console.log(`refreshing module view: ${this.moduleProviderView}`);
      this.moduleProviderView?.refresh();
    });
  }

  public dispose(): void {
    this.registeredCommands.forEach(function (cmd, index, commands) {
      cmd.dispose();
      commands.splice(index, 1);
    });
  }
}
