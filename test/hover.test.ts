import * as assert from 'assert';
import * as vscode from 'vscode';

import { FileIndex, Index } from '../src/index';
import { HoverProvider } from '../src/hover';
import { uriFromRelativePath } from '../src/helpers';

suite("Hover Tests", () => {
    test("Can extract variables", async () => {
        let doc = await vscode.workspace.openTextDocument(uriFromRelativePath("hover-test.tf"));

        let successful = await vscode.commands.executeCommand('terraform.index-document', doc.uri) as boolean;
        assert(successful, "forced indexing not successful");

        let hovers = await vscode.commands.executeCommand('vscode.executeHoverProvider', doc.uri, new vscode.Position(3, 20)) as vscode.Hover[];
        assert.notEqual(hovers.length, 0, "no hovers returned");

        let hover = hovers[0];
        assert.deepEqual(hover.range, new vscode.Range(3, 14, 3, 28));

        let content = hover.contents[0] as vscode.MarkdownString;
        assert.equal(content.value, '`default` not specified');
    });

    test("Can extract properties", async () => {
        let doc = await vscode.workspace.openTextDocument(uriFromRelativePath("hover-test.tf"));

        let successful = await vscode.commands.executeCommand('terraform.index-document', doc.uri) as boolean;
        assert(successful, "forced indexing not successful");

        let hovers = await vscode.commands.executeCommand('vscode.executeHoverProvider', doc.uri, new vscode.Position(7, 34)) as vscode.Hover[];
        assert.notEqual(hovers.length, 0, "no hovers returned");

        let hover = hovers[0];
        assert.deepEqual(hover.range, new vscode.Range(7, 13, 7, 54));

        let content = hover.contents[0] as vscode.MarkdownString;
        assert.equal(content.value, 'bucket: `${var.no-default}`');
    });
});