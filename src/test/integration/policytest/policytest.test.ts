/**
 * Copyright IBM Corp. 2016, 2026
 * SPDX-License-Identifier: MPL-2.0
 */

import * as vscode from 'vscode';
import { assert } from 'chai';
import { activateExtension, getDocUri, open, testCompletion } from '../../helper';

suite('policytest (.policytest.hcl)', function () {
  suite('root', function () {
    const docUri = getDocUri('main.policytest.hcl');
    const emptydocUri = getDocUri('empty.policytest.hcl');

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
      assert.equal(doc.languageId, 'terraform-policytest');
    });

    test('completes policy blocks when policy test is present', async () => {
      const expected = [
        new vscode.CompletionItem('data', vscode.CompletionItemKind.Class),
        new vscode.CompletionItem('locals', vscode.CompletionItemKind.Class),
        new vscode.CompletionItem('module', vscode.CompletionItemKind.Class),
        new vscode.CompletionItem('provider', vscode.CompletionItemKind.Class),
        new vscode.CompletionItem('resource', vscode.CompletionItemKind.Class),
      ];
      await testCompletion(docUri, new vscode.Position(0, 0), { items: expected });
    });

    test('completes policy blocks', async () => {
      const expected = [
        new vscode.CompletionItem('data', vscode.CompletionItemKind.Class),
        new vscode.CompletionItem('locals', vscode.CompletionItemKind.Class),
        new vscode.CompletionItem('module', vscode.CompletionItemKind.Class),
        new vscode.CompletionItem('policytest', vscode.CompletionItemKind.Class),
        new vscode.CompletionItem('provider', vscode.CompletionItemKind.Class),
        new vscode.CompletionItem('resource', vscode.CompletionItemKind.Class),
      ];
      await testCompletion(emptydocUri, new vscode.Position(0, 0), { items: expected });
    });
  });

  suite('policytest', function () {
    const docUri = getDocUri('main.policytest.hcl');

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

    test('completes attrs of policytest block', async () => {
      const expected = [
        new vscode.CompletionItem('plugins', vscode.CompletionItemKind.Class),
        new vscode.CompletionItem('targets', vscode.CompletionItemKind.Property),
      ];
      await testCompletion(docUri, new vscode.Position(3, 15), { items: expected });
    });
  });

  suite('module', function () {
    const docUri = getDocUri('main.policytest.hcl');

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

    test('completes attrs of module module block', async () => {
      const expected = [
        new vscode.CompletionItem('expect_failure', vscode.CompletionItemKind.Property),
        new vscode.CompletionItem('meta', vscode.CompletionItemKind.Property),
      ];
      await testCompletion(docUri, new vscode.Position(31, 0), { items: expected });
    });
  });

  suite('provider', function () {
    const docUri = getDocUri('main.policytest.hcl');

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

    test('completes attrs of provider block', async () => {
      const expected = [
        new vscode.CompletionItem('attrs', vscode.CompletionItemKind.Property),
        new vscode.CompletionItem('expect_failure', vscode.CompletionItemKind.Property),
        new vscode.CompletionItem('meta', vscode.CompletionItemKind.Property),
      ];
      await testCompletion(docUri, new vscode.Position(25, 0), { items: expected });
    });
  });
});
