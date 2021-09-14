import * as fs from 'fs';
import * as path from 'path';
import ShortUniqueId from 'short-unique-id';
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
import { config, getFolderName, getWorkspaceFolder, normalizeFolderName, sortedWorkspaceFolders } from './vscodeUtils';

export interface TerraformLanguageClient {
  commandPrefix: string;
  client: LanguageClient;
}

const MULTI_FOLDER_CLIENT = '';
const clients: Map<string, TerraformLanguageClient> = new Map();

/**
 * ClientHandler maintains lifecycles of language clients
 * based on the server's capabilities (whether multi-folder
 * workspaces are supported).
 */
export class ClientHandler {
  private shortUid: ShortUniqueId;
  private supportsMultiFolders = true;

  constructor(private lsPath: ServerPath, private reporter: TelemetryReporter) {
    this.shortUid = new ShortUniqueId();
    if (lsPath.hasCustomBinPath()) {
      this.reporter.sendTelemetryEvent('usePathToBinary');
    }
  }

  public async startClients(folders?: string[]): Promise<vscode.Disposable[]> {
    const disposables: vscode.Disposable[] = [];

    if (this.supportsMultiFolders) {
      if (clients.has(MULTI_FOLDER_CLIENT)) {
        console.log(`No need to start another client for ${folders}`);
        return disposables;
      }

      console.log('Starting client');

      const tfClient = this.createTerraformClient();
      const readyClient = tfClient.client.onReady().then(async () => {
        this.reporter.sendTelemetryEvent('startClient');
        const multiFoldersSupported =
          tfClient.client.initializeResult.capabilities.workspace?.workspaceFolders?.supported;
        console.log(`Multi-folder support: ${multiFoldersSupported}`);

        if (!multiFoldersSupported) {
          // restart is needed to launch folder-focused instances
          console.log('Restarting clients as folder-focused');
          await this.stopClients(folders);
          this.supportsMultiFolders = false;
          await this.startClients(folders);
        }
      });

      disposables.push(tfClient.client.start());
      await readyClient;
      clients.set(MULTI_FOLDER_CLIENT, tfClient);

      return disposables;
    }

    if (folders && folders.length > 0) {
      for (const folder of folders) {
        if (!clients.has(folder)) {
          console.log(`Starting client for ${folder}`);
          const folderClient = this.createTerraformClient(folder);
          const readyClient = folderClient.client.onReady().then(() => {
            this.reporter.sendTelemetryEvent('startClient');
          });

          disposables.push(folderClient.client.start());
          await readyClient;
          clients.set(folder, folderClient);
        } else {
          console.log(`Client for folder: ${folder} already started`);
        }
      }
    }
    return disposables;
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

    const commandPrefix = this.shortUid.seq();
    let initializationOptions = { commandPrefix, experimentalFeatures };
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
        clients.delete(location);
        this.reporter.sendTelemetryEvent('stopClient');
      }
    });

    return { commandPrefix, client };
  }

  public async stopClients(folders?: string[]): Promise<void[]> {
    const promises: Promise<void>[] = [];

    if (this.supportsMultiFolders) {
      promises.push(this.stopClient(MULTI_FOLDER_CLIENT));
      return Promise.all(promises);
    }

    if (!folders) {
      folders = [];
      for (const key of clients.keys()) {
        folders.push(key);
      }
    }

    for (const folder of folders) {
      promises.push(this.stopClient(folder));
    }
    return Promise.all(promises);
  }

  private async stopClient(folder: string): Promise<void> {
    if (!clients.has(folder)) {
      console.log(`Attempted to stop a client for folder: ${folder} but no client exists`);
      return;
    }

    return clients
      .get(folder)
      .client.stop()
      .then(() => {
        if (folder === '') {
          console.log('Client stopped');
          return;
        }
        console.log(`Client stopped for ${folder}`);
      })
      .then(() => {
        const ok = clients.delete(folder);
        if (ok) {
          if (folder === '') {
            console.log('Client deleted');
            return;
          }
          console.log(`Client deleted for ${folder}`);
        }
      });
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

  public getClient(document?: vscode.Uri): TerraformLanguageClient {
    if (this.supportsMultiFolders) {
      return clients.get(MULTI_FOLDER_CLIENT);
    }

    return clients.get(this.clientName(document.toString()));
  }

  public clientSupportsCommand(cmdName: string, document?: vscode.Uri): boolean {
    const commands = this.getClient(document).client.initializeResult.capabilities.executeCommandProvider?.commands;
    return commands.includes(cmdName);
  }

  private clientName(folderName: string, workspaceFolders: readonly string[] = sortedWorkspaceFolders()): string {
    folderName = normalizeFolderName(folderName);
    const outerFolder = workspaceFolders.find((element) => folderName.startsWith(element));
    // If this folder isn't nested, the found item will be itself
    if (outerFolder && outerFolder !== folderName) {
      folderName = getFolderName(getWorkspaceFolder(outerFolder));
    }
    return folderName;
  }
}
