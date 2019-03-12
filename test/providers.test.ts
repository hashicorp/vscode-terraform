import * as assert from 'assert';
import * as vscode from 'vscode';

suite("Provider Tests", () => {
  test("Correctly show document symbols", async () => {
    let doc1 = await vscode.workspace.openTextDocument({
      language: "terraform",
      content: 'variable "doc-symbol-test" {}'
    });

    let successful = await vscode.commands.executeCommand('terraform.index-document', doc1.uri) as boolean;
    assert(successful, "forced indexing not successful doc1");

    let symbols = await vscode.commands.executeCommand('vscode.executeDocumentSymbolProvider', doc1.uri) as vscode.DocumentSymbol[];

    assert.equal(symbols.length, 1);
    assert.equal(symbols[0].name, 'doc-symbol-test');
    assert.equal(symbols[0].kind, vscode.SymbolKind.Variable);
  });

  test("Correctly show document symbols properties", async () => {
    let doc1 = await vscode.workspace.openTextDocument({
      language: "terraform",
      content: 'resource "resource_type" "doc-symbol-test-2" { property = "a"\n  group { sub = 5 } }'
    });

    let successful = await vscode.commands.executeCommand('terraform.index-document', doc1.uri) as boolean;
    assert(successful, "forced indexing not successful doc1");

    // we return DocumentSymbol but the command rewrites to symbolinformation and flattens the tree
    let symbols = await vscode.commands.executeCommand('vscode.executeDocumentSymbolProvider', doc1.uri) as vscode.DocumentSymbol[];

    assert.equal(symbols.length, 1);
    assert.equal(symbols[0].name, 'doc-symbol-test-2');
    assert.equal(symbols[0].children.length, 2);
  });

  test("Correctly show workspace symbols", async () => {
    let doc1 = await vscode.workspace.openTextDocument({
      language: "terraform",
      content: 'variable "workspace-symbol-test-1" {}'
    });

    let successful = await vscode.commands.executeCommand('terraform.index-document', doc1.uri) as boolean;
    assert(successful, "forced indexing not successful doc1");

    let doc2 = await vscode.workspace.openTextDocument({
      language: "terraform",
      content: 'variable "workspace-symbol-test-2" {}'
    });

    successful = await vscode.commands.executeCommand('terraform.index-document', doc2.uri) as boolean;
    assert(successful, "forced indexing not successful doc2");

    let symbols = await vscode.commands.executeCommand('vscode.executeWorkspaceSymbolProvider', 'workspace') as vscode.SymbolInformation[];

    assert(symbols.length >= 2, `symbols.length(=${symbols.length}) >= 2`);

    const s1 = symbols.find((s) => s.name === "workspace-symbol-test-1");
    const s2 = symbols.find((s) => s.name === "workspace-symbol-test-2");

    assert(s1);
    assert(s2);
  });

  test("Allow matching workspace symbols by type", async () => {
    let doc1 = await vscode.workspace.openTextDocument({
      language: "terraform",
      content: 'resource "test_resource_workspace_symbol" "workspace-symbol-test-3" {}'
    });

    let successful = await vscode.commands.executeCommand('terraform.index-document', doc1.uri) as boolean;
    assert(successful, "forced indexing not successful doc1");

    let doc2 = await vscode.workspace.openTextDocument({
      language: "terraform",
      content: 'resource "test_resource_workspace_symbol" "workspace-symbol-test-4" {}'
    });

    successful = await vscode.commands.executeCommand('terraform.index-document', doc2.uri) as boolean;
    assert(successful, "forced indexing not successful doc2");

    let symbols = await vscode.commands.executeCommand('vscode.executeWorkspaceSymbolProvider', 'test_resource_work') as vscode.SymbolInformation[];

    assert(symbols.length >= 2, `symbols.length(=${symbols.length}) >= 2`);

    const s1 = symbols.find((s) => s.name === "workspace-symbol-test-3");
    const s2 = symbols.find((s) => s.name === "workspace-symbol-test-4");

    assert(s1);
    assert(s2);
  });
});