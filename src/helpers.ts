import * as vscode from 'vscode';
import { readFile } from 'fs';

export function isTerraformDocument(document: vscode.TextDocument): boolean {
  return document.languageId === "terraform";
}

export function read(path: string): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    readFile(path, (err, data) => {
      if (err) {
        reject(err);
      } else {
        resolve(data.toString('utf8'));
      }
    });
  });
}

export function uriFromRelativePath(path: string, folder?: vscode.WorkspaceFolder): vscode.Uri {
  if (!folder) {
    folder = vscode.workspace.workspaceFolders[0];
  }

  return folder.uri.with({
    path: [folder.uri.path, path].join('/')
  });
}