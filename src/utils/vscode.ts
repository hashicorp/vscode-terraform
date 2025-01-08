// Copyright (c) The OpenTofu Authors
// SPDX-License-Identifier: MPL-2.0
// Copyright (c) HashiCorp, Inc.
// SPDX-License-Identifier: MPL-2.0

import * as vscode from 'vscode';
import { InitializeError, ResponseError } from 'vscode-languageclient';

export function config(section: string, scope?: vscode.ConfigurationScope): vscode.WorkspaceConfiguration {
  return vscode.workspace.getConfiguration(section, scope);
}

export function getScope(section: string, settingName: string): vscode.ConfigurationTarget {
  let target: vscode.ConfigurationTarget = vscode.ConfigurationTarget.Global;

  // getConfiguration('terraform').inspect('languageServer');
  // not getConfiguration('terraform').inspect('languageServer.external'); !
  // can use when we extract settings
  const inspect = vscode.workspace.getConfiguration(section).inspect(settingName);
  if (inspect === undefined) {
    return target;
  }

  if (inspect.globalValue) {
    target = vscode.ConfigurationTarget.Global;
  }
  if (inspect.workspaceFolderValue) {
    target = vscode.ConfigurationTarget.WorkspaceFolder;
  }
  if (inspect.workspaceValue) {
    target = vscode.ConfigurationTarget.Workspace;
  }

  return target;
}

// getActiveTextEditor returns an active (visible and focused) TextEditor
// We intentionally do *not* use vscode.window.activeTextEditor here
// because it also contains Output panes which are considered editors
// see also https://github.com/microsoft/vscode/issues/58869
export function getActiveTextEditor(): vscode.TextEditor | undefined {
  return vscode.window.visibleTextEditors.find((textEditor) => !!textEditor.viewColumn);
}

/*
  Detects whether this is a Terraform file we can perform operations on
 */
export function isTerraformFile(document?: vscode.TextDocument): boolean {
  if (document === undefined) {
    return false;
  }

  if (document.isUntitled) {
    // Untitled files are files which haven't been saved yet, so we don't know if they
    // are terraform so we return false
    return false;
  }

  // TODO: check for supported language IDs here instead
  if (document.fileName.endsWith('tf')) {
    // For the purposes of this extension, anything with the tf file
    // extension is a Terraform file
    return true;
  }

  // be safe and default to false
  return false;
}

function isInitializeError(error: unknown): error is ResponseError<InitializeError> {
  return (error as ResponseError<InitializeError>).data?.retry !== undefined;
}

export async function handleLanguageClientStartError(error: unknown, ctx: vscode.ExtensionContext) {
  let message = 'Unknown Error';
  if (isInitializeError(error)) {
    // handled in initializationFailedHandler
    return;
  } else if (error instanceof Error) {
    message = error.message;
  } else if (typeof error === 'string') {
    message = error;
  }

  if (message === 'INVALID_URI_WSL') {
    // handle in startLanguageServer()
    if (ctx.globalState.get<boolean>('opentofu.disableWSLNotification') === true) {
      return;
    }

    const messageText =
      'It looks like you opened a WSL url using a Windows UNC path' +
      ' outside of the [Remote WSL extension](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-wsl).' +
      ' The HashiCorp Terraform Extension works seamlessly with the Remote WSL Extension, but cannot work with this URL. Would you like to reopen this folder' +
      ' in the WSL Extension?';

    const choice = await vscode.window.showErrorMessage(
      messageText,
      {
        detail: messageText,
        modal: false,
      },
      { title: 'Reopen Folder in WSL' },
      { title: 'More Info' },
      { title: 'Supress' },
    );
    if (choice === undefined) {
      return;
    }

    switch (choice.title) {
      case 'Suppress':
        ctx.globalState.update('opentofu.disableWSLNotification', true);
        break;
      case 'Reopen Folder in WSL':
        await vscode.commands.executeCommand('remote-wsl.reopenInWSL');
        break;
      case 'More Info':
        await vscode.commands.executeCommand(
          'vscode.open',
          vscode.Uri.parse('https://github.com/gamunu/vscode-opentofu/blob/main/README.md#remote-extension-support'),
        );
    }
  } else {
    await vscode.window.showErrorMessage(message);
  }
}
