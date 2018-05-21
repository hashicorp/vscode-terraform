// The module 'assert' provides assertion methods from node
import * as assert from 'assert';
import * as vscode from 'vscode';
import { FileIndex } from '../../src/index/file-index';
import { Section } from '../../src/index/section';

suite("Index Tests", () => {
    suite("Section tests", () => {
        test("variable ID", () => {
            let variable = new Section("variable", null, null, "region", null, null, null);

            assert.equal(variable.id(), "var.region");
        });

        test("resource ID", () => {
            let resource = new Section("resource", "aws_s3_bucket", null, "bucket", null, null, null);

            assert.equal(resource.id(), "aws_s3_bucket.bucket");
        });

        test("data ID", () => {
            let data = new Section("data", "template_file", null, "template", null, null, null);

            assert.equal(data.id(), "data.template_file.template");
        });

        test("output ID", () => {
            let output = new Section("output", null, null, "template", null, null, null);

            assert.equal(output.id(), "template");
        });

        test("local ID", () => {
            let output = new Section("local", null, null, "my-cool-variable", null, null, null);

            assert.equal(output.id(), "local.my-cool-variable");
        });

        test("accepts new name when returning id", () => {
            let variable = new Section("variable", null, null, "region", null, null, null);

            assert.equal(variable.id("newName"), "var.newName");
        });

        test("Extracts all toplevel attributes", () => {
            let template = `
resource "aws_s3_bucket" "bucket" {
    bucket = "name"

    logging {
        enabled = true // should not be indexed
    }
}

provider "aws" {
    version = "~> 1.0"
}
`;

            let [fileIndex, diagnostic] = FileIndex.fromString(vscode.Uri.parse("a.tf"), template);

            let resource = fileIndex.sections[0];
            assert.equal(resource.attributes.size, 1);
            assert.equal(resource.attributes.get("bucket"), "name");

            let provider = fileIndex.sections[1];
            assert.equal(provider.attributes.size, 1);
            assert.equal(provider.attributes.get("version"), "~> 1.0");
        });


        test("Extract no attributes for local sections (they are virtual)", () => {
            let template = `
locals {
    a = 5
}
`;

            let [fileIndex, diagnostic] = FileIndex.fromString(vscode.Uri.parse("a.tf"), template);

            let localA = fileIndex.sections[0];
            assert.equal(localA.attributes.size, 0);
        });
    });
});