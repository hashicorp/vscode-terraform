import * as vscode from 'vscode';
import { getConfiguration } from '../configuration';
import { ErrorDiagnosticCollection } from '../extension';
import { Logger } from '../logger';
import { Reporter } from '../telemetry';
import { Index } from './index';
import { IndexLocator } from './index-locator';
import { from_vscode_Uri } from './vscode-adapter';

const logger = new Logger("index-watcher");

async function updateDocument(index: Index, uri: vscode.Uri): Promise<void> {
  let doc = await vscode.workspace.openTextDocument(uri);

  if (doc.isDirty || doc.languageId !== "terraform") {
    // ignore
    return;
  }

  try {
    if (!index.indexDocument(doc, { exclude: getConfiguration().indexing.exclude })) {
      logger.info(`Index not generated for: ${uri.toString()}`);
    } else {
      logger.info(`Indexed ${uri.toString()}`);
    }

  } catch (e) {
    logger.exception("Could not index template file", e);

    let range = new vscode.Range(0, 0, 0, 300);
    let diagnostics = new vscode.Diagnostic(range, `Unhandled error parsing document: ${e}`, vscode.DiagnosticSeverity.Error);

    ErrorDiagnosticCollection.set(uri, [diagnostics]);
  }
}

async function update(indexLocator: IndexLocator, uri: vscode.Uri): Promise<void> {
  try {
    let index = indexLocator.getIndexForUri(uri);
    if (!index) {
      logger.info("Cannot locate index for:", uri.toString());
      return;
    }

    return await updateDocument(index, uri);
  } catch (error) {
    logger.exception(`Could not update index for ${uri.toString()}`, error);
  }
}

export function createWorkspaceWatcher(indexLocator: IndexLocator): vscode.FileSystemWatcher {
  let watcher = vscode.workspace.createFileSystemWatcher("**/*.{tf,tfvars}");
  watcher.onDidChange((uri) => { update(indexLocator, uri) });
  watcher.onDidCreate((uri) => { update(indexLocator, uri) });
  watcher.onDidDelete((uri) => {
    try {
      indexLocator.getIndexForUri(uri).delete(from_vscode_Uri(uri));
    } catch (error) {
      logger.exception(`Could not delete index for ${uri.toString()}`, error);
    }
  });
  return watcher;
}

export async function initialCrawl(indexLocator: IndexLocator): Promise<vscode.Uri[]> {
  logger.info("Crawling workspace for terraform files...");
  const start = process.hrtime();
  const files = await vscode.workspace.findFiles("**/*.{tf,tfvars}");

  await vscode.window.withProgress({
    location: vscode.ProgressLocation.Window,
    title: "Indexing terraform templates"
  }, async (progress) => {
    for (let uri of files) {
      progress.report({ message: `Indexing ${uri.toString()}` });
      await update(indexLocator, uri);
    }
  });

  const elapsed = process.hrtime(start);
  const elapsedMs = elapsed[0] * 1e3 + elapsed[1] / 1e6;

  Reporter.trackEvent("initialCrawl", {}, {
    totalTimeMs: elapsedMs,
    numberOfDocs: files.length,
    averagePerDocTimeMs: elapsedMs / files.length
  });
  return files;
}