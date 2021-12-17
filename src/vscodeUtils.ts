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

  if (document.fileName.endsWith('tf')) {
    // For the purposes of this extension, anything with the tf file
    // extension is a Terraform file
    return true;
  }

  // be safe and default to false
  return false;
}

export function sortedWorkspaceFolders(): string[] {
  const workspaceFolders = vscode.workspace.workspaceFolders;
  if (workspaceFolders) {
    return workspaceFolders
      .map((f) => getFolderName(f))
      .sort((a, b) => {
        return a.length - b.length;
      });
  }
  return [];
}
