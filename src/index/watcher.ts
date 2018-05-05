
import * as vscode from 'vscode';
import * as minimatch from 'minimatch';
import { Index } from './index';
import { ErrorDiagnosticCollection, outputChannel } from '../extension';
import { getConfiguration } from '../configuration';

function updateDocument(index: Index, uri: vscode.Uri): Thenable<void> {
  return vscode.workspace.openTextDocument(uri).then((doc) => {
    if (doc.isDirty || doc.languageId !== "terraform") {
      // ignore
      return;
    }

    try {
      if (!index.indexDocument(doc, { exclude: getConfiguration().indexing.exclude })) {
        outputChannel.appendLine(`terraform.crawler: Index not generated for: ${uri.toString()}`);
      } else {
        outputChannel.appendLine(`terraform.crawler: Indexed ${uri.toString()}`);
      }

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
  outputChannel.appendLine("terraform.crawler: Crawling workspace for terraform files...");
  return vscode.workspace.findFiles("**/*.{tf,tfvars}", "")
    .then((uris) => {
      return vscode.window.withProgress({
        location: vscode.ProgressLocation.Window,
        title: "Indexing terraform templates"
      }, async (progress) => {
        for (let uri of uris) {
          progress.report({ message: `Indexing ${uri.toString()}` });
          await updateDocument(index, uri);
        }

        return uris;
      });
    });
}