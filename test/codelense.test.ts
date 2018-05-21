import * as assert from 'assert';
import * as vscode from 'vscode';

suite("CodeLense Tests", () => {
  test("Annotates sections", async () => {
    let doc = await vscode.workspace.openTextDocument({
      language: "terraform",
      content:
        'resource "aws_s3_bucket" "document-link-test" {\n' +
        '  bucket = "document-link-test"\n' +
        '}'
    });

    let successful = await vscode.commands.executeCommand('terraform.index-document', doc.uri) as boolean;
    assert(successful, "forced indexing not successful");

    let lenses = await vscode.commands.executeCommand('vscode.executeCodeLensProvider', doc.uri, 10) as vscode.CodeLens[];
    assert.equal(lenses.length, 1);

    let lense = lenses[0];
    assert.deepEqual(lense.range, doc.lineAt(0).range);
    assert.notEqual(lense.command, null);
    assert.equal(lense.command.command, "terraform.showReferences");
  });

  test("Does not annotates providers", async () => {
    let doc = await vscode.workspace.openTextDocument({
      language: "terraform",
      content:
        'provider "aws" {}'
    });

    let successful = await vscode.commands.executeCommand('terraform.index-document', doc.uri) as boolean;
    assert(successful, "forced indexing not successful");

    let lenses = await vscode.commands.executeCommand('vscode.executeCodeLensProvider', doc.uri, 10) as vscode.CodeLens[];
    assert.equal(lenses.length, 0);
  });
});