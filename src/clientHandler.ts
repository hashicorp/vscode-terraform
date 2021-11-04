import * as vscode from 'vscode';
import TelemetryReporter from 'vscode-extension-telemetry';
import {
  DocumentSelector,
  Executable,
  LanguageClient,
  LanguageClientOptions,
  RevealOutputChannelOn,
  ServerOptions,
  State,
} from 'vscode-languageclient/node';

import { ServerPath } from './serverPath';
import { ShowReferencesFeature } from './showReferences';
import { config } from './vscodeUtils';

export interface TerraformLanguageClient {
  client: LanguageClient;
}

/**
 * ClientHandler maintains lifecycles of language clients
 * based on the server's capabilities
 */
export class ClientHandler {
  private tfClient: TerraformLanguageClient;
  private supportedCommands: string[];

  constructor(
    private lsPath: ServerPath,
    private outputChannel: vscode.OutputChannel,
    private reporter: TelemetryReporter,
  ) {
    if (lsPath.hasCustomBinPath()) {
      this.reporter.sendTelemetryEvent('usePathToBinary');
    }
    this.supportedCommands = [];
  }

  public async startClients(): Promise<vscode.Disposable[]> {
    const disposables: vscode.Disposable[] = [];

    this.outputChannel.appendLine('Starting client');

    this.tfClient = this.createTerraformClient();

    disposables.push(this.tfClient.client.start());

    await this.tfClient.client.onReady().then(async () => {
      this.reporter.sendTelemetryEvent('startClient');
      const multiFoldersSupported =
        this.tfClient.client.initializeResult.capabilities.workspace?.workspaceFolders?.supported;
      this.outputChannel.appendLine(`Multi-folder support: ${multiFoldersSupported}`);

      this.supportedCommands = this.tfClient.client.initializeResult.capabilities.executeCommandProvider?.commands;
    });

    return disposables;
  }

  public async stopClients(): Promise<void> {
    return this.tfClient.client
      .stop()
      .then(() => {
        this.outputChannel.appendLine('Client stopped');
      })
      .then(() => {
        this.outputChannel.appendLine('Client deleted');
      });
  }

  private createTerraformClient(): TerraformLanguageClient {
    const binaryName = this.lsPath.binName();
    const channelName = `${binaryName}`;
    const outputChannel: vscode.OutputChannel = vscode.window.createOutputChannel(channelName);
    const documentSelector: DocumentSelector = [
      { scheme: 'file', language: 'terraform' },
      { scheme: 'file', language: 'terraform-vars' },
    ];

    const rootModulePaths: string[] = config('terraform-ls').get('terraformExecPath');
    const terraformExecPath: string = config('terraform-ls').get('terraformExecTimeout');
    const terraformExecTimeout: string = config('terraform-ls').get('terraformLogFilePath');
    const terraformLogFilePath: string = config('terraform-ls').get('rootModules');
    const excludeModulePaths: string[] = config('terraform-ls').get('excludeRootModules');

    if (rootModulePaths.length > 0 && excludeModulePaths.length > 0) {
      throw new Error(
        'Only one of rootModules and excludeRootModules can be set at the same time, please remove the conflicting config and reload',
      );
    }

    const experimentalFeatures = config('terraform-ls').get('experimentalFeatures');
    const initializationOptions = Object.assign(
      { experimentalFeatures },
      terraformExecPath.length > 0 ? { terraformExecPath } : null,
      terraformExecTimeout.length > 0 ? { terraformExecTimeout } : null,
      terraformLogFilePath.length > 0 ? { terraformLogFilePath } : null,
      rootModulePaths.length > 0 ? { rootModulePaths } : null,
      excludeModulePaths.length > 0 ? { excludeModulePaths } : null,
    );

    const cmd = this.lsPath.resolvedPathToBinary();
    const serverArgs: string[] = config('terraform').get('languageServer.args');
    const executable: Executable = {
      command: cmd,
      args: serverArgs,
      options: {},
    };
    const serverOptions: ServerOptions = {
      run: executable,
      debug: executable,
    };
    outputChannel.appendLine(`Launching language server: ${cmd} ${serverArgs.join(' ')}`);

    const clientOptions: LanguageClientOptions = {
      documentSelector: documentSelector,
      initializationOptions: initializationOptions,
      initializationFailedHandler: (error) => {
        this.reporter.sendTelemetryException(error);
        return false;
      },
      outputChannel: outputChannel,
      revealOutputChannelOn: RevealOutputChannelOn.Never,
    };

    const id = `terraform-ls`;
    const name = `Terraform LS`;
    const client = new LanguageClient(id, name, serverOptions, clientOptions);

    client.registerFeature(new ShowReferencesFeature(client));

    client.onDidChangeState((event) => {
      if (event.newState === State.Stopped) {
        this.reporter.sendTelemetryEvent('stopClient');
      }
    });

    return { client };
  }

  public getClient(): TerraformLanguageClient {
    return this.tfClient;
  }

  public clientSupportsCommand(cmdName: string): boolean {
    return this.supportedCommands.includes(cmdName);
  }
}
