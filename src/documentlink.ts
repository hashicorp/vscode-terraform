import * as vscode from 'vscode';
import { findResourceFormat } from './autocompletion/model';
import { getConfiguration } from './configuration';
import { IndexLocator } from './index/index-locator';
import { to_vscode_Range } from './index/vscode-adapter';
import { Logger } from './logger';
import { Reporter } from './telemetry';

export class DocumentLinkProvider implements vscode.DocumentLinkProvider {
  private logger = new Logger("document-link-provider");

  constructor(private indexLocator: IndexLocator) { }

  provideDocumentLinks(document: vscode.TextDocument, token: vscode.CancellationToken): vscode.ProviderResult<vscode.DocumentLink[]> {
    try {
      let index = this.indexLocator.getIndexForDoc(document).getOrIndexDocument(document, { exclude: getConfiguration().indexing.exclude });
      if (!index)
        return [];

      return index.sections.map((s) => {
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
