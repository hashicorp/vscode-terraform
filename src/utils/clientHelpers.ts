import * as net from 'net';
import * as vscode from 'vscode';
import { Executable, InitializeResult, ServerOptions } from 'vscode-languageclient/node';
import { config } from './vscode';
import { ServerPath } from './serverPath';
import { outputChannel } from '../extension';

export async function getServerOptions(lsPath: ServerPath): Promise<ServerOptions> {
  let serverOptions: ServerOptions;

  const port = config('terraform').get<number>('languageServer.tcp.port');
  if (port) {
    const inspect = vscode.workspace.getConfiguration('terraform').inspect('languageServer.path');
    if (inspect !== undefined && (inspect.globalValue || inspect.workspaceFolderValue || inspect.workspaceValue)) {
      vscode.window.showWarningMessage(
        'You cannot use terraform.languageServer.tcp.port with terraform.languageServer.path. Ignoring terraform.languageServer.path and proceeding to connect via TCP',
      );
    }

    serverOptions = async () => {
      const socket = new net.Socket();
      socket.connect({
        port: port,
        host: 'localhost',
      });
      return {
        writer: socket,
        reader: socket,
      };
    };

    outputChannel?.appendLine(`Connecting to language server via TCP at localhost:${port}`);
    return serverOptions;
  }

  const cmd = await lsPath.resolvedPathToBinary();
  const serverArgs = config('terraform').get<string[]>('languageServer.args', []);
  outputChannel?.appendLine(`Launching language server: ${cmd} ${serverArgs.join(' ')}`);
  const executable: Executable = {
    command: cmd,
    args: serverArgs,
    options: {},
  };
  serverOptions = {
    run: executable,
    debug: executable,
  };

  return serverOptions;
}

interface InitializationOptions {
  indexing?: IndexingOptions;
  experimentalFeatures?: ExperimentalFeatures;
  ignoreSingleFileWarning?: boolean;
  terraform?: TerraformOptions;
}

interface TerraformOptions {
  path: string;
  timeout: string;
  logFilePath: string;
}

interface IndexingOptions {
  ignoreDirectoryNames: string[];
  ignorePaths: string[];
}

interface ExperimentalFeatures {
  validateOnSave: boolean;
  prefillRequiredFields: boolean;
}

export function getInitializationOptions() {
  /*
    This is basically a set of settings masquerading as a function. The intention
    here is to make room for this to be added to a configuration builder when
    we tackle #791
  */
  const terraform = config('terraform').get<TerraformOptions>('languageServer.terraform', {
    path: '',
    timeout: '',
    logFilePath: '',
  });
  const indexing = config('terraform').get<IndexingOptions>('languageServer.indexing', {
    ignoreDirectoryNames: [],
    ignorePaths: [],
  });
  const ignoreSingleFileWarning = config('terraform').get<boolean>('languageServer.ignoreSingleFileWarning', false);
  const experimentalFeatures = config('terraform').get<ExperimentalFeatures>('experimentalFeatures');

  // deprecated
  const rootModulePaths = config('terraform').get<string[]>('languageServer.rootModules', []);
  if (rootModulePaths.length > 0 && indexing.ignorePaths.length > 0) {
    throw new Error(
      'Only one of rootModules and indexing.ignorePaths can be set at the same time, please remove the conflicting config and reload',
    );
  }

  const initializationOptions: InitializationOptions = {
    experimentalFeatures,
    ignoreSingleFileWarning,
    terraform,
    ...(rootModulePaths.length > 0 && { rootModulePaths }),
    indexing,
  };

  return initializationOptions;
}

export function clientSupportsCommand(initializeResult: InitializeResult | undefined, cmdName: string): boolean {
  if (!initializeResult) {
    return false;
  }

  return initializeResult.capabilities.executeCommandProvider?.commands.includes(cmdName) ?? false;
}
