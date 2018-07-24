import * as vscode from 'vscode';
import { findResourceFormat } from './autocompletion/model';
import { IndexAdapter } from './index/index-adapter';
import { to_vscode_Range } from './index/vscode-adapter';
import { Logger } from './logger';
import { Reporter } from './telemetry';

export class DocumentLinkProvider implements vscode.DocumentLinkProvider {
  private logger = new Logger("document-link-provider");

  constructor(private index: IndexAdapter) { }

  provideDocumentLinks(document: vscode.TextDocument, token: vscode.CancellationToken): vscode.ProviderResult<vscode.DocumentLink[]> {
    try {
      let [file, group] = this.index.indexDocument(document);
      if (!file || !group)
        return [];

      return file.sections.map((s) => {
        if (!s.type)
          return null;
        let doc = findResourceFormat(s.sectionType, s.type);
        if (!doc)
          return null;

        return new vscode.DocumentLink(to_vscode_Range(s.typeLocation.range), vscode.Uri.parse(doc.url));
      }).filter((d) => d != null);
    } catch (error) {
      this.logger.exception("Could not provide document links", error);
      Reporter.trackException("provideDocumentLinks", error);
    }
  }
}
