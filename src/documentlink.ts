import * as vscode from 'vscode';
import { Index } from './index';
import { getConfiguration } from './configuration';
import { findResourceFormat } from './autocompletion/model';
import { Uri } from 'vscode';

export class DocumentLinkProvider implements vscode.DocumentLinkProvider {
    constructor(private index: Index) {}

    provideDocumentLinks(document: vscode.TextDocument, token: vscode.CancellationToken): vscode.ProviderResult<vscode.DocumentLink[]> {
        let index = this.index.getOrIndexDocument(document, { exclude: getConfiguration().indexing.exclude });
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