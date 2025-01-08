// Copyright (c) The OpenTofu Authors
// SPDX-License-Identifier: MPL-2.0
// Copyright (c) HashiCorp, Inc.
// SPDX-License-Identifier: MPL-2.0

import * as net from 'net';
import * as vscode from 'vscode';
import { Executable, InitializeResult, ServerOptions } from 'vscode-languageclient/node';
import { config } from './vscode';
import { ServerPath } from './serverPath';

export async function getServerOptions(
  lsPath: ServerPath,
  outputChannel: vscode.OutputChannel,
): Promise<ServerOptions> {
  let serverOptions: ServerOptions;

  const port = config('opentofu').get<number>('languageServer.tcp.port');
  if (port) {
    const inspect = vscode.workspace.getConfiguration('opentofu').inspect('languageServer.path');
    if (inspect !== undefined && (inspect.globalValue || inspect.workspaceFolderValue || inspect.workspaceValue)) {
      vscode.window.showWarningMessage(
        'You cannot use opentofu.languageServer.tcp.port with opentofu.languageServer.path. Ignoring opentofu.languageServer.path and proceeding to connect via TCP',
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

    outputChannel.appendLine(`Connecting to language server via TCP at localhost:${port}`);
    return serverOptions;
  }

  const cmd = await lsPath.resolvedPathToBinary();
  const serverArgs = config('opentofu').get<string[]>('languageServer.args', []);
  outputChannel.appendLine(`Launching language server: ${cmd} ${serverArgs.join(' ')}`);
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

export function clientSupportsCommand(initializeResult: InitializeResult | undefined, cmdName: string): boolean {
  if (!initializeResult) {
    return false;
  }

  return initializeResult.capabilities.executeCommandProvider?.commands.includes(cmdName) ?? false;
}
