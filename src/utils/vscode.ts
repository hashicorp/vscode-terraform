import * as vscode from 'vscode';

export interface LegacyLanguageServerSettings {
  enable: boolean;
  pathToBinary: string;
  args: string[];
}

export interface LanguageServerSettings {
  enable: boolean;
  pathToBinary: string;
  args: string[];
  ignoreDirectoryNames: string[];
  ignoreSingleFileWarning: boolean;
  rootModules: string[];
  excludeRootModules: string[];
}

export function config(section: string, scope?: vscode.ConfigurationScope): vscode.WorkspaceConfiguration {
  return vscode.workspace.getConfiguration(section, scope);
}

export function getScope(section: string, settingName: string): vscode.ConfigurationTarget {
  let scoppe: vscode.ConfigurationTarget = vscode.ConfigurationTarget.Global;

  // getConfiguration('terraform').inspect('languageServer');
  // not getConfiguration('terraform').inspect('languageServer.external'); !
  // can use when we extract settings
  const inspect = vscode.workspace.getConfiguration(section).inspect(settingName);
  if (inspect === undefined) {
    return scoppe;
  }

  if (inspect.globalValue) {
    scoppe = vscode.ConfigurationTarget.Global;
  }
  if (inspect.workspaceFolderValue) {
    scoppe = vscode.ConfigurationTarget.WorkspaceFolder;
  }
  if (inspect.workspaceValue) {
    scoppe = vscode.ConfigurationTarget.Workspace;
  }

  return scoppe;
}

export async function warnIfMigrate(settings: string[]): Promise<boolean> {
  for (let index = 0; index < settings.length; index++) {
    const setting = settings[index];
    const section = setting.split('.')[0];
    const settingName = setting.replace(section + '.', '');

    const inspect = await vscode.workspace.getConfiguration(section).inspect(settingName);
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

export async function migrate(
  section: string,
  oldSettingName: string,
  newSettingName: string,
): Promise<vscode.ConfigurationTarget> {
  const target: vscode.ConfigurationTarget = vscode.ConfigurationTarget.Global;

  const inspect = vscode.workspace.getConfiguration(section).inspect(oldSettingName);
  if (inspect === undefined) {
    return target;
  }

  const targetSection = section === 'terraform-ls' ? 'terraform' : section;
  if (inspect.globalValue !== undefined) {
    await vscode.workspace
      .getConfiguration(targetSection)
      .update(newSettingName, inspect.globalValue, vscode.ConfigurationTarget.Global);
  }
  if (inspect.workspaceFolderValue !== undefined) {
    await vscode.workspace
      .getConfiguration(targetSection)
      .update(newSettingName, inspect.workspaceFolderValue, vscode.ConfigurationTarget.WorkspaceFolder);
  }
  if (inspect.workspaceValue !== undefined) {
    await vscode.workspace
      .getConfiguration(targetSection)
      .update(newSettingName, inspect.workspaceValue, vscode.ConfigurationTarget.Workspace);
  }

  return target;
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
