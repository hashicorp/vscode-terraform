// The module 'assert' provides assertion methods from node
import * as assert from 'assert';
import * as vscode from 'vscode';
import { FileIndex } from '../../src/index/file-index';
import { Index } from '../../src/index/index';


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
    suite("Index Tests", () => {
        let [a, errorA] = FileIndex.fromString(vscode.Uri.parse("a.tf"), `resource "aws_s3_bucket" "bucket" {}`);
        let [b, errorB] = FileIndex.fromString(vscode.Uri.parse("b.tf"), `variable "region" {}`);

        test("query can return results for ALL files", () => {
            let index = new Index(null, a, b);

            let results = index.query("ALL_FILES");

            assert.equal(results.length, 2);
        });

        test("query returns results for a single file", () => {
            let index = new Index(null, a, b);

            let results = index.query(vscode.Uri.parse("a.tf"));

            assert.equal(results.length, 1);
            assert.equal(results[0].name, "bucket");
        });

        test("clear clears", () => {
            let index = new Index(null, a, b);

            assert.notEqual(index.query("ALL_FILES").length, 0);

            // TODO: check callback aswell
            index.clear();

            assert.equal(index.query("ALL_FILES").length, 0);
        });

        test("does not index documents from excluded paths", async () => {
            let index = new Index(null);

            let base = vscode.workspace.workspaceFolders[0].uri;
            let doc = await vscode.workspace.openTextDocument(vscode.Uri.parse(`${base.toString()}/template.tf`));

            assert.equal(index.indexDocument(doc, { exclude: ["*"] }), null, "should not index document when all paths are excluded");

            assert.notEqual(index.indexDocument(doc), null, "should index doc");
        });

        suite("References", () => {
            let [c, errorC] = FileIndex.fromString(vscode.Uri.parse("c.tf"), `resource "aws_s3_bucket" "bucket2" { name = "\${var.region}" }`);
            let [d, errorD] = FileIndex.fromString(vscode.Uri.parse("d.tf"), `resource "aws_s3_bucket" "bucket3" { name = "\${var.region}" }`);

            test("getReferences returns results for all files", () => {
                let index = new Index(null, a, b, c, d);

                let references = index.queryReferences("ALL_FILES", { target: "var.region" });

                assert.equal(references.length, 2);
            });

            test("getReferences returns results for a single file", () => {
                let index = new Index(null, a, b, c, d);

                let references = index.queryReferences(d.uri, { target: "var.region" });

                assert.equal(references.length, 1);
            });

            test("getReferences supports section as a target instead of string", () => {
                let index = new Index(null, a, b, c, d);

                let references = index.queryReferences("ALL_FILES", { target: b.sections[0] });
                assert.equal(references.length, 2);
            });
        });

        suite("Higher-order analysis", () => {
            let [c, errorC] = FileIndex.fromString(vscode.Uri.parse("c.tf"), `provider "aws" { version = "~> 1.0" }`);
            let [d, errorD] = FileIndex.fromString(vscode.Uri.parse("d.tf"), `provider "azure" { version = "~> 2.0" alias = "way-cooler" }`);

            test("Extract provider info", () => {
                let index = new Index(null, a, b, c, d);

                let providers = index.getProviderDeclarations();
                assert.equal(providers.length, 2);

                let aws = providers.find((p) => p.name === "aws");
                assert(!!aws);
                assert(!aws.alias);
                assert.equal(aws.version, "~> 1.0");

                let azure = providers.find((p) => p.name === "azure");
                assert(!!azure);
                assert.equal(azure.version, "~> 2.0");
                assert.equal(azure.alias, "way-cooler");
            });
        });
    });
});