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
import { ServerPath } from './serverPath';
import { ShowReferencesFeature } from './showReferences';
import { config } from './vscodeUtils';

export interface TerraformLanguageClient {
  commandPrefix: string;
  client: LanguageClient;
}

/**
 * ClientHandler maintains lifecycles of language clients
 * based on the server's capabilities
 */
export class ClientHandler {
  private shortUid: ShortUniqueId;
  private tfClient: TerraformLanguageClient;
  private commands: string[] = [];

  constructor(
    private lsPath: ServerPath,
    private outputChannel: vscode.OutputChannel,
    private reporter: TelemetryReporter,
  ) {
    this.shortUid = new ShortUniqueId();
    this.commands = [];
    if (lsPath.hasCustomBinPath()) {
      this.reporter.sendTelemetryEvent('usePathToBinary');
    }
  }

  public async startClient(): Promise<vscode.Disposable[]> {
    const disposables: vscode.Disposable[] = [];

    console.log('Starting client');

    this.tfClient = this.createTerraformClient();
    const readyClient = this.tfClient.client.onReady().then(async () => {
      this.reporter.sendTelemetryEvent('startClient');
      const multiFoldersSupported =
        this.tfClient.client.initializeResult.capabilities.workspace?.workspaceFolders?.supported;
      console.log(`Multi-folder support: ${multiFoldersSupported}`);

      this.commands = this.tfClient.client.initializeResult.capabilities.executeCommandProvider?.commands;
    });

    disposables.push(this.tfClient.client.start());
    await readyClient;

    return disposables;
  }

  private createTerraformClient(): TerraformLanguageClient {
    const commandPrefix = this.shortUid.seq();

    const initializationOptions = this.getInitializationOptions(commandPrefix);

    const serverOptions = this.getServerOptions();
    this.outputChannel.appendLine(
      `Launching language server: ${serverOptions.run.command} ${serverOptions.run.args.join(' ')}`,
    );

    const documentSelector: DocumentSelector = [
      { scheme: 'file', language: 'terraform' },
      { scheme: 'file', language: 'terraform-vars' },
    ];

    const clientOptions: LanguageClientOptions = {
      documentSelector: documentSelector,
      initializationOptions: initializationOptions,
      initializationFailedHandler: (error) => {
        this.reporter.sendTelemetryException(error);
        return false;
      },
      outputChannel: this.outputChannel,
      revealOutputChannelOn: RevealOutputChannelOn.Never,
    };

    const id = `terraform`;
    const client = new LanguageClient(id, serverOptions, clientOptions);

    const codeLensReferenceCount = config('terraform').get('codelens.referenceCount');
    if (codeLensReferenceCount) {
      client.registerFeature(new ShowReferencesFeature(client));
    }

    client.onDidChangeState((event) => {
      console.log(`Client: ${State[event.oldState]} --> ${State[event.newState]}`);
      if (event.newState === State.Stopped) {
        this.reporter.sendTelemetryEvent('stopClient');
      }
    });

    return { commandPrefix, client };
  }

  private getServerOptions() {
    const cmd = this.lsPath.resolvedPathToBinary();
    const serverArgs = config('terraform').get<string[]>('languageServer.args');
    const executable: Executable = {
      command: cmd,
      args: serverArgs,
      options: {},
    };
    const serverOptions: ServerOptions = {
      run: executable,
      debug: executable,
    };
    return serverOptions;
  }

  private getInitializationOptions(commandPrefix: string) {
    const rootModulePaths = config('terraform-ls').get<string[]>('rootModules', []);
    const terraformExecPath: string = config('terraform-ls').get('terraformExecPath');
    const terraformExecTimeout: string = config('terraform-ls').get('terraformExecTimeout');
    const terraformLogFilePath: string = config('terraform-ls').get('terraformLogFilePath');
    const excludeModulePaths: string[] = config('terraform-ls').get('excludeRootModules');
    const ignoreDirectoryNames: string[] = config('terraform-ls').get('ignoreDirectoryNames');

    if (rootModulePaths.length > 0 && excludeModulePaths.length > 0) {
      throw new Error(
        'Only one of rootModules and excludeRootModules can be set at the same time, please remove the conflicting config and reload',
      );
    }

    const experimentalFeatures = config('terraform-ls').get('experimentalFeatures');
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
    if (ignoreDirectoryNames.length > 0) {
      initializationOptions = Object.assign(initializationOptions, { ignoreDirectoryNames });
    }
    return initializationOptions;
  }

  public async stopClient(): Promise<void> {
    if (this.tfClient === undefined) {
      return Promise.resolve();
    }

    if (this.tfClient?.client === undefined) {
      return Promise.resolve();
    }

    return this.tfClient.client
      .stop()
      .then(() => {
        console.log('Client stopped');
      })
      .then(() => {
        console.log('Client deleted');
      });
  }

  public getClient(): TerraformLanguageClient {
    return this.tfClient;
  }

  public clientSupportsCommand(cmdName: string): boolean {
    return this.commands.includes(cmdName);
  }
}
