import * as vscode from 'vscode';
import { execFile } from 'child_process';

import { getConfiguration } from './configuration';
import { errorDiagnosticCollection } from './extension';

let runner;

function liveIndexEnabledForDocument(doc: vscode.TextDocument): boolean {
  if (doc.languageId !== 'terraform') {
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
    // process(e.document.getText())
    //  .then((index) => {
    //    errorDiagnosticCollection.set(e.document.uri, index.Errors.map(createDiagnostic));
    //    runner = null;
    //  })
    //  .catch((err) => {
    //    console.log("Error:", err);
    //   runner = null;
    //  });
  }, getConfiguration().indexing.liveIndexingDelay);
}