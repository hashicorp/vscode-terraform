import * as fs from 'fs';
import * as path from 'path';
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
import * as which from 'which';
import { CUSTOM_BIN_PATH_OPTION_NAME, ServerPath } from './serverPath';
import { ShowReferencesFeature } from './showReferences';
import { config, getWorkspaceFolder } from './vscodeUtils';

export interface TerraformLanguageClient {
  client: LanguageClient;
}

/**
 * ClientHandler maintains lifecycles of language clients
 * based on the server's capabilities
 */
export class ClientHandler {
  private tfClient: TerraformLanguageClient;

  constructor(private lsPath: ServerPath, private reporter: TelemetryReporter) {
    if (lsPath.hasCustomBinPath()) {
      this.reporter.sendTelemetryEvent('usePathToBinary');
    }
  }

  public async startClients(): Promise<vscode.Disposable[]> {
    const disposables: vscode.Disposable[] = [];

    console.log('Starting client');

    this.tfClient = this.createTerraformClient();

    disposables.push(this.tfClient.client.start());

    await this.tfClient.client.onReady().then(async () => {
      this.reporter.sendTelemetryEvent('startClient');
      const multiFoldersSupported =
        this.tfClient.client.initializeResult.capabilities.workspace?.workspaceFolders?.supported;
      console.log(`Multi-folder support: ${multiFoldersSupported}`);
    });

    return disposables;
  }

  public async stopClients(): Promise<void> {
    return this.tfClient.client
      .stop()
      .then(() => {
        console.log('Client stopped');
      })
      .then(() => {
        console.log('Client deleted');
      });
  }

  private createTerraformClient(location?: string): TerraformLanguageClient {
    const cmd = this.resolvedPathToBinary();
    const binaryName = this.lsPath.binName();

    const serverArgs: string[] = config('terraform').get('languageServer.args');
    const experimentalFeatures = config('terraform-ls').get('experimentalFeatures');

    let channelName = `${binaryName}`;
    let id = `terraform-ls`;
    let name = `Terraform LS`;
    let wsFolder: vscode.WorkspaceFolder;
    let rootModulePaths: string[];
    let terraformExecPath: string;
    let terraformExecTimeout: string;
    let terraformLogFilePath: string;
    let excludeModulePaths: string[];
    let documentSelector: DocumentSelector;
    let outputChannel: vscode.OutputChannel;
    if (location) {
      channelName = `${binaryName}: ${location}`;
      id = `terraform-ls/${location}`;
      name = `Terraform LS: ${location}`;
      wsFolder = getWorkspaceFolder(location);
      documentSelector = [
        { scheme: 'file', language: 'terraform', pattern: `${wsFolder.uri.fsPath}/**/*` },
        { scheme: 'file', language: 'terraform-vars', pattern: `${wsFolder.uri.fsPath}/**/*` },
      ];
      terraformExecPath = config('terraform-ls', wsFolder).get('terraformExecPath');
      terraformExecTimeout = config('terraform-ls', wsFolder).get('terraformExecTimeout');
      terraformLogFilePath = config('terraform-ls', wsFolder).get('terraformLogFilePath');
      rootModulePaths = config('terraform-ls', wsFolder).get('rootModules');
      excludeModulePaths = config('terraform-ls', wsFolder).get('excludeRootModules');
      outputChannel = vscode.window.createOutputChannel(channelName);
      outputChannel.appendLine(`Launching language server: ${cmd} ${serverArgs.join(' ')} for folder: ${location}`);
    } else {
      documentSelector = [
        { scheme: 'file', language: 'terraform' },
        { scheme: 'file', language: 'terraform-vars' },
      ];
      terraformExecPath = config('terraform-ls').get('terraformExecPath');
      terraformExecTimeout = config('terraform-ls').get('terraformExecTimeout');
      terraformLogFilePath = config('terraform-ls').get('terraformLogFilePath');
      rootModulePaths = config('terraform-ls').get('rootModules');
      excludeModulePaths = config('terraform-ls').get('excludeRootModules');
      outputChannel = vscode.window.createOutputChannel(channelName);
      outputChannel.appendLine(`Launching language server: ${cmd} ${serverArgs.join(' ')}`);
    }

    if (rootModulePaths.length > 0 && excludeModulePaths.length > 0) {
      throw new Error(
        'Only one of rootModules and excludeRootModules can be set at the same time, please remove the conflicting config and reload',
      );
    }

    let initializationOptions = { experimentalFeatures };
    if (terraformExecPath.length > 0) {
      initializationOptions = Object.assign(initializationOptions, { terraformExecPath });
    }
    if (terraformExecTimeout.length > 0) {
      initializationOptions = Object.assign(initializationOptions, { terraformExecTimeout });
    }
    if (terraformLogFilePath.length > 0) {
      initializationOptions = Object.assign(initializationOptions, { terraformLogFilePath });
    }
    if (rootModulePaths.length > 0) {
      initializationOptions = Object.assign(initializationOptions, { rootModulePaths });
    }
    if (excludeModulePaths.length > 0) {
      initializationOptions = Object.assign(initializationOptions, { excludeModulePaths });
    }

    const executable: Executable = {
      command: cmd,
      args: serverArgs,
      options: {},
    };
    const serverOptions: ServerOptions = {
      run: executable,
      debug: executable,
    };
    const clientOptions: LanguageClientOptions = {
      documentSelector: documentSelector,
      workspaceFolder: wsFolder,
      initializationOptions: initializationOptions,
      initializationFailedHandler: (error) => {
        this.reporter.sendTelemetryException(error);
        return false;
      },
      outputChannel: outputChannel,
      revealOutputChannelOn: RevealOutputChannelOn.Never,
    };

    const client = new LanguageClient(id, name, serverOptions, clientOptions);

    client.registerFeature(new ShowReferencesFeature(client));

    client.onDidChangeState((event) => {
      if (event.newState === State.Stopped) {
        this.reporter.sendTelemetryEvent('stopClient');
      }
    });

    return { client };
  }

  private resolvedPathToBinary(): string {
    const pathToBinary = this.lsPath.binPath();
    let cmd: string;
    try {
      if (path.isAbsolute(pathToBinary)) {
        fs.accessSync(pathToBinary, fs.constants.X_OK);
        cmd = pathToBinary;
      } else {
        cmd = which.sync(pathToBinary);
      }
      console.log(`Found server at ${cmd}`);
    } catch (err) {
      let extraHint: string;
      if (this.lsPath.hasCustomBinPath()) {
        extraHint = `. Check "${CUSTOM_BIN_PATH_OPTION_NAME}" in your settings.`;
      }
      throw new Error(`Unable to launch language server: ${err.message}${extraHint}`);
    }

    return cmd;
  }

  public getClient(): TerraformLanguageClient {
    return this.tfClient;
  }

  public clientSupportsCommand(cmdName: string): boolean {
    const commands = this.tfClient.client.initializeResult.capabilities.executeCommandProvider?.commands;
    return commands.includes(cmdName);
  }
}
