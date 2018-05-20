import * as vscode from 'vscode';
import { TerraformIndexConfiguration, getConfiguration } from './configuration';
import { isTerraformDocument } from './helpers';
import { Index } from './index';
import { IndexLocator } from './index/index-locator';

let runner;

function liveIndexEnabledForDocument(cfg: TerraformIndexConfiguration, doc: vscode.TextDocument): boolean {
  if (!isTerraformDocument(doc)) {
    return false;
  }

  return cfg.enabled && cfg.liveIndexing;
}

export function liveIndex(indexLocator: IndexLocator, e: vscode.TextDocumentChangeEvent) {
  const cfg = getConfiguration().indexing;

  if (!liveIndexEnabledForDocument(cfg, e.document)) {
    return;
  }

  if (runner != null) {
    clearTimeout(runner);
  }
  runner = setTimeout(function () {
    indexLocator.getIndexForDoc(e.document).indexDocument(e.document, { exclude: cfg.exclude });
  }, cfg.liveIndexingDelay);
}