
import * as vscode from 'vscode';
import { Index } from './index';
import { parseHcl } from './hcl-hil';
import { build } from './build';

function updateDocument(index: Index, uri: vscode.Uri) {
  vscode.workspace.openTextDocument(uri).then((doc) => {
    if (doc.isDirty || doc.languageId !== "terraform") {
      // ignore
      return;
    }

    let ast = parseHcl(doc.getText());
    let fileIndex = build(uri, ast);

    index.add(fileIndex);
  });
}

export function createWorkspaceWatcher(index: Index): vscode.FileSystemWatcher {
  let watcher = vscode.workspace.createFileSystemWatcher("**/*.{tf,tfvars}");
  watcher.onDidChange((uri) => { updateDocument(index, uri) });
  watcher.onDidCreate((uri) => { updateDocument(index, uri) });
  watcher.onDidDelete((uri) => { index.delete(uri) });
  return watcher;
}

export function initialCrawl(index: Index): Thenable<vscode.Uri[]> {
  return vscode.workspace.findFiles("**/*.{tf,tfvars}", "")
    .then((uris) => {
      uris.forEach((uri) => updateDocument(index, uri));

      return uris;
    });
}