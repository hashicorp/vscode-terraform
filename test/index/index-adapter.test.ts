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

        test("does not index documents from excluded paths", async () => {
            let adapter = new IndexAdapter(new Index, ["*"]);

            let base = vscode.workspace.workspaceFolders[0].uri;
            let doc = await vscode.workspace.openTextDocument(vscode.Uri.parse(`${base.toString()}/template.tf`));

            let [file, group] = adapter.indexDocument(doc);
            assert(!file && !group, "should not index document when all paths are excluded");

            adapter.excludePaths = [];

            [file, group] = adapter.indexDocument(doc);
            assert(file && group, "should index doc");
        });

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
    });
});