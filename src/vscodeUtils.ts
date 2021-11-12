import * as vscode from 'vscode';

export function config(section: string, scope?: vscode.ConfigurationScope): vscode.WorkspaceConfiguration {
  return vscode.workspace.getConfiguration(section, scope);
}

export function getFolderName(folder: vscode.WorkspaceFolder): string {
  return normalizeFolderName(folder.uri.toString());
}

// Make sure that folder uris always end with a slash
export function normalizeFolderName(folderName: string): string {
  if (folderName.charAt(folderName.length - 1) !== '/') {
    folderName = folderName + '/';
  }
  return folderName;
}

export function getWorkspaceFolder(folderName: string): vscode.WorkspaceFolder {
  return vscode.workspace.getWorkspaceFolder(vscode.Uri.parse(folderName));
}

// getActiveTextEditor returns an active (visible and focused) TextEditor
// We intentionally do *not* use vscode.window.activeTextEditor here
// because it also contains Output panes which are considered editors
// see also https://github.com/microsoft/vscode/issues/58869
export function getActiveTextEditor(): vscode.TextEditor {
  return vscode.window.visibleTextEditors.find((textEditor) => !!textEditor.viewColumn);
}

export function sortedWorkspaceFolders(): string[] {
  const workspaceFolders = vscode.workspace.workspaceFolders;
  if (workspaceFolders) {
    return vscode.workspace.workspaceFolders
      .map((f) => getFolderName(f))
      .sort((a, b) => {
        return a.length - b.length;
      });
  }
  return [];
}
