// The module 'assert' provides assertion methods from node
import * as assert from 'assert';
import * as vscode from 'vscode';
import Uri from 'vscode-uri';
import { FileIndex } from '../../src/index/file-index';
import { Index } from '../../src/index/index';
import { IndexAdapter } from '../../src/index/index-adapter';

const template =
    `
resource "aws_s3_bucket" "bucket" {}
variable "region" {}
data "template_file" "template" {}
locals {
    local = "local-string"
}
`;

suite("Index Tests", () => {
    suite("IndexAdapter Tests", () => {
        let [a, errorA] = FileIndex.fromString(Uri.parse("a.tf"), `resource "aws_s3_bucket" "bucket" {}`);
        let [b, errorB] = FileIndex.fromString(Uri.parse("b.tf"), `variable "region" {}`);

        /* something fails after switching to vscode-test
        test("does not index documents from excluded paths", async () => {
            let adapter = new IndexAdapter(new Index, ["*"]);

            let p = path.join(vscode.workspace.workspaceFolders[0].uri.fsPath, 'template.tf');
            let doc = await vscode.workspace.openTextDocument(vscode.Uri.file(p));

            let [file, group] = adapter.indexDocument(doc);
            assert(!file && !group, "should not index document when all paths are excluded");

            adapter.excludePaths = [];

            [file, group] = adapter.indexDocument(doc);
            assert(file && group, "should index doc");
        });
        */

        test("errors are added to diagnostics collection", async () => {
            let doc = await vscode.workspace.openTextDocument({
                language: 'terraform',
                content: '}}'
            });

            let adapter = new IndexAdapter(new Index, []);
            let [file, group] = adapter.indexDocument(doc);

            assert(adapter.errors.has(doc.uri));
        });

        test("delete deletes index and errors", async () => {
            let doc = await vscode.workspace.openTextDocument({
                language: 'terraform',
                content: '}}'
            });

            let adapter = new IndexAdapter(new Index, []);
            let [file, group] = adapter.indexDocument(doc);

            assert(adapter.errors.has(doc.uri));

            adapter.delete(doc.uri);

            assert(!adapter.errors.has(doc.uri));
        });

        test("emits event", async () => {
            let adapter = new IndexAdapter(new Index, []);

            let called = false;
            let disposable = adapter.onDidChange(() => { called = true; });

            let doc = await vscode.workspace.openTextDocument({
                language: 'terraform',
                content: 'variable "var" {}'
            });

            let [file, group] = adapter.indexDocument(doc);
            assert(file, "expected indexDocument to succeed");

            assert(called, "expected event to have been fired");

            disposable.dispose();
        });
    });
});