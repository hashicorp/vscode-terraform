import * as assert from 'assert';
import * as vscode from 'vscode';
import { indexLocator } from '../../src/extension';

suite("Index Tests", () => {
    suite("WorkspaceFolderIndexAdapter Tests", () => {
        test("Unsaved files have shared index", async () => {
            let doc1 = await vscode.workspace.openTextDocument({
                language: "terraform",
                content: 'variable "var" {}'
            });

            let doc2 = await vscode.workspace.openTextDocument({
                language: "terraform",
                content: 'variable "var2" {}'
            });

            let index1 = indexLocator.getIndexForUri(doc1.uri);
            let index2 = indexLocator.getIndexForUri(doc2.uri);

            assert(!!index1);
            assert(!!index2);

            assert.equal(index1, index2);
        });
    });
});