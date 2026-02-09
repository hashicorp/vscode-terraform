/**
 * Copyright IBM Corp. 2016, 2026
 * SPDX-License-Identifier: MPL-2.0
 */

import * as vscode from 'vscode';
import { assert } from 'chai';
import { activateExtension, getDocUri, open, testCompletion } from '../../helper';

suite('policy (.policy.hcl)', function () {
  suite('root', function () {
    const docUri = getDocUri('main.policy.hcl');

    // ONE setup for the entire file
    this.beforeAll(async () => {
      await open(docUri);
      await activateExtension();
    });

    // ONE cleanup for the entire file
    this.afterAll(async () => {
      await vscode.commands.executeCommand('workbench.action.closeAllEditors');
    });
    test('language is registered', async () => {
      const doc = await vscode.workspace.openTextDocument(docUri);
      assert.equal(doc.languageId, 'terraform-policy');
    });

    test('completes policy blocks', async () => {
      const expected = [
        new vscode.CompletionItem('locals', vscode.CompletionItemKind.Class),
        new vscode.CompletionItem('module_policy', vscode.CompletionItemKind.Class),
        new vscode.CompletionItem('policy', vscode.CompletionItemKind.Class),
        new vscode.CompletionItem('provider_policy', vscode.CompletionItemKind.Class),
        new vscode.CompletionItem('resource_policy', vscode.CompletionItemKind.Class),
      ];
      await testCompletion(docUri, new vscode.Position(0, 0), { items: expected });
    });
  });

  suite('resource_policy', function () {
    const docUri = getDocUri('main.policy.hcl');

    this.beforeAll(async () => {
      await open(docUri);
      await activateExtension();
    });

    this.afterAll(async () => {
      await vscode.commands.executeCommand('workbench.action.closeAllEditors');
    });
    this.afterEach(async () => {
      await vscode.commands.executeCommand('workbench.action.files.revert');
    });

    test('completes attrs of resource policy block', async () => {
      const expected = [
        new vscode.CompletionItem('enforcement_level', vscode.CompletionItemKind.Property),
        new vscode.CompletionItem('plugins', vscode.CompletionItemKind.Class),
        new vscode.CompletionItem('terraform_config', vscode.CompletionItemKind.Class),
      ];
      await testCompletion(docUri, new vscode.Position(2, 15), { items: expected });
    });
  });

  suite('module_policy', function () {
    const docUri = getDocUri('main.policy.hcl');

    this.beforeAll(async () => {
      await open(docUri);
      await activateExtension();
    });

    this.afterAll(async () => {
      await vscode.commands.executeCommand('workbench.action.closeAllEditors');
    });
    this.afterEach(async () => {
      await vscode.commands.executeCommand('workbench.action.files.revert');
    });

    test('completes attrs of module policy block', async () => {
      const expected = [
        new vscode.CompletionItem('enforce', vscode.CompletionItemKind.Class),
        new vscode.CompletionItem('filter', vscode.CompletionItemKind.Property),
      ];
      await testCompletion(docUri, new vscode.Position(23, 0), { items: expected });
    });
  });

  suite('provider_policy', function () {
    const docUri = getDocUri('main.policy.hcl');

    this.beforeAll(async () => {
      await open(docUri);
      await activateExtension();
    });

    this.afterAll(async () => {
      await vscode.commands.executeCommand('workbench.action.closeAllEditors');
    });
    this.afterEach(async () => {
      await vscode.commands.executeCommand('workbench.action.files.revert');
    });

    test('completes attrs of provider policy block', async () => {
      const expected = [
        new vscode.CompletionItem('enforce', vscode.CompletionItemKind.Class),
        new vscode.CompletionItem('filter', vscode.CompletionItemKind.Property),
      ];
      await testCompletion(docUri, new vscode.Position(30, 0), { items: expected });
    });
  });
});
