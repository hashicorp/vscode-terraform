import * as vscode from 'vscode';
import { getConfiguration, TerraformIndexConfiguration } from './configuration';
import { isTerraformDocument } from './helpers';
import { IndexLocator } from './index/index-locator';
import { Logger } from './logger';

let runner;

function liveIndexEnabledForDocument(cfg: TerraformIndexConfiguration, doc: vscode.TextDocument): boolean {
  if (!isTerraformDocument(doc)) {
    return false;
  }

  return cfg.enabled && cfg.liveIndexing;
}

export function liveIndex(indexLocator: IndexLocator, e: vscode.TextDocumentChangeEvent) {
  const logger = new Logger("live-index");
  const cfg = getConfiguration().indexing;

  if (!liveIndexEnabledForDocument(cfg, e.document)) {
    return;
  }

  if (runner != null) {
    clearTimeout(runner);
  }
  runner = setTimeout(function () {
    try {
      indexLocator.getIndexForDoc(e.document).indexDocument(e.document, { exclude: cfg.exclude });
    } catch (error) {
      logger.warn("Live index failed", error);
    }
  }, cfg.liveIndexingDelay);
}