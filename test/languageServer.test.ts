import * as assert from 'assert';
import * as vscode from 'vscode';
import { ToggleLanguageServerCommand } from '../src/commands/toggleLanguageServer';
import { getConfiguration } from '../src/configuration';
import { InstallLanguageServerCommand } from '../src/commands/installLanguageServer';
import { ExperimentalLanguageClient } from '../src/languageclient';
import { executeProvider, shouldHaveCompletion } from './completion-provider.test'


suite("Language Server", () => {
  test("Install", async () => {
    await vscode.commands.executeCommand('terraform.' + InstallLanguageServerCommand.CommandName, '18762624');
  }).timeout(100000); // Involves the download so may run long.

  test("Enable", async () => {
    await vscode.commands.executeCommand('terraform.' + ToggleLanguageServerCommand.CommandName, false);

    assert.equal(getConfiguration().languageServer.enabled, true, "Expect language server to be enabled");
    assert.equal(getConfiguration().indexing.enabled, false, "Expect indexing to be enabled");

    // Load a doc to start the server
    let doc = await vscode.workspace.openTextDocument({
      language: "terraform",
      content:
        'resource "aws_s3_bucket" "document-link-test" {\n' +
        '  bucket = "document-link-test"\n' +
        '}'
    });

    assert(ExperimentalLanguageClient.isRunning, "Expect Language Server to be running")
  }).timeout(100000);


  test("Variable completion", async () => {
    let doc = await vscode.workspace.openTextDocument({
      language: 'terraform',
      content: 'output "output" {\n' +
        '  value = var.\n' +
        '}\n' +
        'variable "variable" {}\n' +
        'resource "resource_type" "resource" {}'
    });

    let completions = await executeProvider(doc.uri, new vscode.Position(1, 15));

    assert(ExperimentalLanguageClient.isRunning, "Expect Language Server to be running")
    assert.notEqual(completions.items.length, 0, "completions should not be empty");

    assert(shouldHaveCompletion(completions, "variable"))

  }).timeout(1000);


  test("Disable", async () => {
    await vscode.commands.executeCommand('terraform.' + ToggleLanguageServerCommand.CommandName, false);

    assert.equal(getConfiguration().languageServer.enabled, false, "Expect language server to be enabled");
    assert.equal(getConfiguration().indexing.enabled, true, "Expect indexing to be enabled");

    let doc = await vscode.workspace.openTextDocument({
      language: "terraform",
      content:
        'resource "aws_s3_bucket" "document-link-test" {\n' +
        '  bucket = "document-link-test"\n' +
        '}'
    });

    assert(!ExperimentalLanguageClient.isRunning, "Expect Language Server to be stopped")
  }).timeout(1000);
});