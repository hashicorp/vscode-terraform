import * as vscode from 'vscode';
import { execFile } from 'child_process';

import { getConfiguration } from './configuration';
import { ErrorDiagnosticCollection } from './extension';
import { isTerraformDocument } from './helpers';
import { WorkspaceIndex } from './index';

let runner;

function liveIndexEnabledForDocument(doc: vscode.TextDocument): boolean {
  if (!isTerraformDocument(doc)) {
    return false;
  }

  let cfg = getConfiguration().indexing;
  return cfg.enabled && cfg.liveIndexing;
}

export function liveIndex(e: vscode.TextDocumentChangeEvent) {
  if (!liveIndexEnabledForDocument(e.document)) {
    return;
  }

  if (runner != null) {
    clearTimeout(runner);
  }
  runner = setTimeout(function () {
    WorkspaceIndex.indexDocument(e.document);
  }, getConfiguration().indexing.liveIndexingDelay);
}