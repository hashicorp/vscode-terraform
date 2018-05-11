import * as assert from 'assert';
import * as vscode from 'vscode';

suite("Hover Tests", () => {
    test("Can extract variables", async () => {
        let doc = await vscode.workspace.openTextDocument({
            language: "terraform",
            content: 'variable "hover-test-1" {} resource "aws_s3_bucket" "hover-test-1" { bucket = "${var.hover-test-1}" }'
        });

        let successful = await vscode.commands.executeCommand('terraform.index-document', doc.uri) as boolean;
        assert(successful, "forced indexing not successful");

        let hovers = await vscode.commands.executeCommand('vscode.executeHoverProvider', doc.uri, new vscode.Position(0, 88)) as vscode.Hover[];
        assert.notEqual(hovers.length, 0, "no hovers returned");

        let hover = hovers[0];
        assert.deepEqual(hover.range, new vscode.Range(0, 81, 0, 97));

        let content = hover.contents[0] as vscode.MarkdownString;
        assert.equal(content.value, '`default` not specified');
    });

    test("Can extract properties", async () => {
        let doc = await vscode.workspace.openTextDocument({
            language: "terraform",
            content: 'resource "aws_s3_bucket" "hover-test-2" { bucket = "${var.hover-test-2}" } resource "aws_s3_bucket" "hover-test-3" { bucket = "${aws_s3_bucket.hover-test-2.bucket}" }'
        });

        let successful = await vscode.commands.executeCommand('terraform.index-document', doc.uri) as boolean;
        assert(successful, "forced indexing not successful");

        let hovers = await vscode.commands.executeCommand('vscode.executeHoverProvider', doc.uri, new vscode.Position(0, 159)) as vscode.Hover[];
        assert.notEqual(hovers.length, 0, "no hovers returned");

        let hover = hovers[0];
        assert.deepEqual(hover.range, new vscode.Range(0, 129, 0, 162));

        let content = hover.contents[0] as vscode.MarkdownString;
        assert.equal(content.value, 'bucket: `${var.hover-test-2}`');
    });

    test("Can extract locals", async () => {
        let doc = await vscode.workspace.openTextDocument({
            language: "terraform",
            content: 'locals { hover-local-1 = "A" } resource "aws_s3_bucket" "hover-test-3" { bucket = "${local.hover-local-1}" }'
        });

        let successful = await vscode.commands.executeCommand('terraform.index-document', doc.uri) as boolean;
        assert(successful, "forced indexing not successful");

        let hovers = await vscode.commands.executeCommand('vscode.executeHoverProvider', doc.uri, new vscode.Position(0, 93)) as vscode.Hover[];
        assert.notEqual(hovers.length, 0, "no hovers returned");

        let hover = hovers[0];
        assert.deepEqual(hover.range, new vscode.Range(0, 85, 0, 104));

        let content = hover.contents[0] as vscode.MarkdownString;
        assert.equal(content.value, 'hover-local-1: `A`');
    });
});