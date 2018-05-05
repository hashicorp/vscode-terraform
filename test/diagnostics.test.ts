import * as assert from 'assert';
import * as vscode from 'vscode';

import { FileIndex, Index } from '../src/index';
import { HoverProvider } from '../src/hover';
import { uriFromRelativePath } from '../src/helpers';
import { ErrorDiagnosticCollection } from '../src/extension';

suite("Diagnostics Tests", () => {
    test("Errors are added to diagnostics collection", async () => {
        let doc = await vscode.workspace.openTextDocument({
            language: 'terraform',
            content: '}}'
        });

        let successful = await vscode.commands.executeCommand('terraform.index-document', doc.uri) as boolean;
        assert(!successful, "forced indexing not successful");

        assert(ErrorDiagnosticCollection.has(doc.uri));
    });
});