import * as vscode from 'vscode';
import { TerraformIndexConfiguration, getConfiguration } from './configuration';
import { isTerraformDocument } from './helpers';
import { Index } from './index';

let runner;

function liveIndexEnabledForDocument(cfg: TerraformIndexConfiguration, doc: vscode.TextDocument): boolean {
  if (!isTerraformDocument(doc)) {
    return false;
  }

  return cfg.enabled && cfg.liveIndexing;
}

export function liveIndex(index: Index, e: vscode.TextDocumentChangeEvent) {
  const cfg = getConfiguration().indexing;

  if (!liveIndexEnabledForDocument(cfg, e.document)) {
    return;
  }

  if (runner != null) {
    clearTimeout(runner);
  }
  runner = setTimeout(function () {
    index.indexDocument(e.document, { exclude: cfg.exclude });
  }, cfg.liveIndexingDelay);
}