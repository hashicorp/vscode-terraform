// The module 'assert' provides assertion methods from node
import * as assert from 'assert';
import * as vscode from 'vscode';
import { FileIndex } from '../../src/index/file-index';
import { Index } from '../../src/index/index';
import { IndexAdapter } from '../../src/index/index-adapter';
import { Uri } from '../../src/index/uri';


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

            assert.equal(adapter.indexDocument(doc), null, "should not index document when all paths are excluded");

            adapter.excludePaths = [];

            assert.notEqual(adapter.indexDocument(doc), null, "should index doc");
        });
    });
});