import * as vscode from 'vscode';
import { getConfiguration, TerraformIndexConfiguration } from './configuration';
import { isTerraformDocument } from './helpers';
import { IndexAdapter } from './index/index-adapter';
import { Logger } from './logger';

let runner;

function liveIndexEnabledForDocument(cfg: TerraformIndexConfiguration, doc: vscode.TextDocument): boolean {
  if (!isTerraformDocument(doc)) {
    return false;
  }

  return cfg.enabled && cfg.liveIndexing;
}

export function liveIndex(index: IndexAdapter, e: vscode.TextDocumentChangeEvent) {
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
      index.indexDocument(e.document);
    } catch (error) {
      logger.warn("Live index failed", error);
    }
  }, cfg.liveIndexingDelay);
}