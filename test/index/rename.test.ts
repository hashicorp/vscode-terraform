import * as assert from 'assert';
import * as vscode from 'vscode';

suite("Rename Tests", () => {
  test("Correctly performs renames", async () => {
    let doc1 = await vscode.workspace.openTextDocument({
      language: "terraform",
      content: 'variable "rename-test" {}'
    });

    let successful = await vscode.commands.executeCommand('terraform.index-document', doc1.uri) as boolean;
    assert(successful, "forced indexing not successful doc1");

    let doc2 = await vscode.workspace.openTextDocument({
      language: "terraform",
      content: 'rename-test = "hello"'
    });
    successful = await vscode.commands.executeCommand('terraform.index-document', doc2.uri) as boolean;
    assert(successful, "forced indexing not successful doc2");

    let doc3 = await vscode.workspace.openTextDocument({
      language: "terraform",
      content: 'resource "aws_s3_bucket" "rename-test-bucket" {\n  bucket = "${var.rename-test}"\n}'
    });
    successful = await vscode.commands.executeCommand('terraform.index-document', doc3.uri) as boolean;
    assert(successful, "forced indexing not successful doc3");

    let edit = await vscode.commands.executeCommand('vscode.executeDocumentRenameProvider', doc1.uri, new vscode.Position(0, 14), "NEWNAME") as vscode.WorkspaceEdit;
    let editSuccessful = await vscode.workspace.applyEdit(edit);
    assert(editSuccessful, "edit not successful");

    assert.equal(doc1.lineAt(0).text, 'variable "NEWNAME" {}');
    assert.equal(doc2.lineAt(0).text, 'NEWNAME = "hello"');
    assert.equal(doc3.lineAt(1).text, '  bucket = "${var.NEWNAME}"');
  });
});