
import * as vscode from 'vscode';
import { Index } from './index';
import { parseHcl, ParseError, Ast } from './hcl-hil';
import { build } from './build';
import { ErrorDiagnosticCollection } from '../extension';

function updateDocument(index: Index, uri: vscode.Uri) {
  vscode.workspace.openTextDocument(uri).then((doc) => {
    if (doc.isDirty || doc.languageId !== "terraform") {
      // ignore
      return;
    }

    try {
      index.indexDocument(doc);
    } catch (e) {
      let range = new vscode.Range(0, 0, 0, 300);
      let diagnostics = new vscode.Diagnostic(range, `Unhandled error parsing document: ${e}`, vscode.DiagnosticSeverity.Error);

      ErrorDiagnosticCollection.set(uri, [diagnostics]);
    }
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