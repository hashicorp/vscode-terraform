import * as vscode from 'vscode';
import { findResourceFormat } from './autocompletion/model';
import { getConfiguration } from './configuration';
import { Index } from './index';
import { IndexLocator } from './index/index-locator';

export class DocumentLinkProvider implements vscode.DocumentLinkProvider {
    constructor(private indexLocator: IndexLocator) { }

    provideDocumentLinks(document: vscode.TextDocument, token: vscode.CancellationToken): vscode.ProviderResult<vscode.DocumentLink[]> {
        let index = this.indexLocator.getIndexForDoc(document).getOrIndexDocument(document, { exclude: getConfiguration().indexing.exclude });
        if (!index)
            return [];
        return index.sections.map((s) => {
            if (!s.type)
                return null;

            let doc = findResourceFormat(s.sectionType, s.type);
            if (!doc)
                return null;

            return new vscode.DocumentLink(s.typeLocation.range, vscode.Uri.parse(doc.url));
        }).filter((d) => d != null);
    }
};