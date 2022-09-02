import TelemetryReporter from '@vscode/extension-telemetry';
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

interface ConfigOption {
  section: string;
  name: string;
}

export function warnIfMigrate(settings: ConfigOption[]): boolean {
  for (let index = 0; index < settings.length; index++) {
    const setting = settings[index];

    const inspect = vscode.workspace.getConfiguration(setting.section).inspect(setting.name);
    if (inspect === undefined) {
      continue;
    }

    if (inspect.globalValue !== undefined) {
      return true;
    }
    if (inspect.workspaceFolderValue !== undefined) {
      return true;
    }
    if (inspect.workspaceValue !== undefined) {
      return true;
    }
  }

  return false;
}

/**
 * Migrate a VS Code Section and setting to a new name.
 *
 * @param section Existing VS Code section to operate on. If `terraform-ls` is provided, it will be migrated to `terraform`
 * @param oldSettingName Existing VS Code setting name to migrate.
 * @param newSettingName New VS Code setting name to migrate to.
 * @return void.
 */
export async function migrate(section: string, oldSettingName: string, newSettingName: string) {
  let configTarget: vscode.ConfigurationTarget = vscode.ConfigurationTarget.Global;

  const inspect = vscode.workspace.getConfiguration(section).inspect(oldSettingName);
  if (inspect === undefined) {
    return configTarget;
  }

  /*
    While this could be more explicit as part of the function definition, it made
    the function call confusing and verbose without any type safety:

      `migrate('terraform-ls','terraform', 'rootModules', 'languageServer.rootModules');`

    We could make this a type but that seemed like too much involvement for this
    short lived task.
  */
  const targetSection = section === 'terraform-ls' ? 'terraform' : section;
  let targetValue: unknown;

  // only change user (global), folder or workspace settings
  if (inspect.globalValue !== undefined) {
    targetValue = inspect.globalValue;
    configTarget = vscode.ConfigurationTarget.Global;
  }
  if (inspect.workspaceFolderValue !== undefined) {
    targetValue = inspect.workspaceFolderValue;
    configTarget = vscode.ConfigurationTarget.WorkspaceFolder;
  }
  if (inspect.workspaceValue !== undefined) {
    targetValue = inspect.workspaceValue;
    configTarget = vscode.ConfigurationTarget.Workspace;
  }

  await vscode.workspace.getConfiguration(targetSection).update(newSettingName, targetValue, configTarget);
  await vscode.workspace.getConfiguration(section).update(oldSettingName, undefined, configTarget);
}

export async function deleteSetting(section: string, settingName: string) {
  const inspect = vscode.workspace.getConfiguration(section).inspect(settingName);
  if (inspect === undefined) {
    return;
  }

  // only change user (global), folder or workspace settings
  if (inspect.globalValue !== undefined) {
    await vscode.workspace.getConfiguration(section).update(settingName, undefined, vscode.ConfigurationTarget.Global);
  }
  if (inspect.workspaceFolderValue !== undefined) {
    await vscode.workspace
      .getConfiguration(section)
      .update(settingName, undefined, vscode.ConfigurationTarget.WorkspaceFolder);
  }
  if (inspect.workspaceValue !== undefined) {
    await vscode.workspace
      .getConfiguration(section)
      .update(settingName, undefined, vscode.ConfigurationTarget.Workspace);
  }
}

export function getWorkspaceFolder(folderName: string): vscode.WorkspaceFolder | undefined {
  return vscode.workspace.getWorkspaceFolder(vscode.Uri.parse(folderName));
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

class InvalidWSLUriError extends Error {}

export async function handleLanguageClientStart(
  error: unknown,
  ctx: vscode.ExtensionContext,
  reporter: TelemetryReporter,
) {
  let message = 'Unknown Error';
  if (error instanceof ResponseError<InitializeError>) {
    message = error.data;
  } else if (error instanceof Error) {
    message = error.message;
  } else if (typeof error === 'string') {
    message = error;
  }

  if (message.startsWith('INVALID_URI_WSL')) {
    // handle in startLanguageServer()
    if (ctx.globalState.get<boolean>('terraform.disableWSLNotification') === true) {
      return;
    }

    const wslerr = new InvalidWSLUriError(message);
    reporter.sendTelemetryException(wslerr);

    const messageText =
      'It looks like you opened a WSL url using a Windows UNC path' +
      ' outside of the Remote WSL extension. The HashiCorp Terraform Extension cannot work with this URL. Would you like to reopen this folder' +
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
        ctx.globalState.update('terraform.disableWSLNotification', true);
        break;
      case 'Reopen Folder in WSL':
        await vscode.commands.executeCommand('remote-wsl.reopenInWSL');
        break;
      case 'More Info':
        await vscode.commands.executeCommand(
          'vscode.open',
          vscode.Uri.parse(
            'https://github.com/hashicorp/vscode-terraform/blob/v2.24.0/README.md#remote-extension-support',
          ),
        );
    }
  } else {
    vscode.window.showErrorMessage(message);
    reporter.sendTelemetryException(typeof error === 'string' ? new Error(error) : new Error());
  }
}
