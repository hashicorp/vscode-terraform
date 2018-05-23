import { readFile } from 'fs';
import * as vscode from 'vscode';

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

export function readBuffer(path: string): Promise<Buffer> {
  return new Promise<Buffer>((resolve, reject) => {
    readFile(path, (err, data) => {
      if (err) {
        reject(err);
      } else {
        resolve(data);
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

type MatcherFunction = (character: string) => boolean;

export function backwardsSearch(haystack: string, matcher: MatcherFunction): number {
  if (haystack.length === 0)
    return -1;

  for (let i = haystack.length - 1; i >= 0; i--) {
    if (matcher(haystack[i])) {
      return i;
    }
  }

  return -1;
}