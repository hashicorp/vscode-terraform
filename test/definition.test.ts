import * as assert from 'assert';
import * as vscode from 'vscode';

suite("Definition provider Tests", () => {
  test("Can find definition for assignments in tfvars", async () => {
    let doc1 = await vscode.workspace.openTextDocument({
      language: "terraform",
      content: 'variable "define-test" {}'
    });

    let successful = await vscode.commands.executeCommand('terraform.index-document', doc1.uri) as boolean;
    assert(successful, "forced indexing not successful doc1");

    let doc2 = await vscode.workspace.openTextDocument({
      language: "terraform",
      content: 'define-test = "hello"'
    });
    successful = await vscode.commands.executeCommand('terraform.index-document', doc2.uri) as boolean;
    assert(successful, "forced indexing not successful doc2");

    let locations = await vscode.commands.executeCommand('vscode.executeDefinitionProvider', doc2.uri, new vscode.Position(0, 5)) as vscode.Location[];

    assert.equal(locations.length, 1);
    assert.equal(locations[0].uri.toString(), doc1.uri.toString());
    assert.deepEqual(locations[0].range, new vscode.Range(0, 0, 0, 24));
  });

  test("Can find definition for assignments in templates", async () => {
    let doc1 = await vscode.workspace.openTextDocument({
      language: "terraform",
      content: 'variable "define-test-2" {}'
    });

    let successful = await vscode.commands.executeCommand('terraform.index-document', doc1.uri) as boolean;
    assert(successful, "forced indexing not successful doc1");

    let doc2 = await vscode.workspace.openTextDocument({
      language: "terraform",
      content: 'resource "resource" "define-test-resource" {\n  property = "${var.define-test-2}"\n}'
    });
    successful = await vscode.commands.executeCommand('terraform.index-document', doc2.uri) as boolean;
    assert(successful, "forced indexing not successful doc2");

    let locations = await vscode.commands.executeCommand('vscode.executeDefinitionProvider', doc2.uri, new vscode.Position(1, 22)) as vscode.Location[];

    assert.equal(locations.length, 1);
    assert.equal(locations[0].uri.toString(), doc1.uri.toString());
    assert.deepEqual(locations[0].range, new vscode.Range(0, 0, 0, 26));
  });
});