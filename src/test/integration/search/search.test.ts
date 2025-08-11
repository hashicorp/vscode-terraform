/**
 * Copyright (c) HashiCorp, Inc.
 * SPDX-License-Identifier: MPL-2.0
 */

import * as vscode from 'vscode';
import { assert } from 'chai';
import { activateExtension, getDocUri, open, testCompletion } from '../../helper';

suite('search (.tfquery.hcl)', () => {
  suite('root', function suite() {
    const docUri = getDocUri('main.tfquery.hcl');

    this.beforeAll(async () => {
      await open(docUri);
      await activateExtension();
    });

    this.afterAll(async () => {
      await vscode.commands.executeCommand('workbench.action.closeAllEditors');
    });

    test('language is registered', async () => {
      const doc = await vscode.workspace.openTextDocument(docUri);
      assert.equal(doc.languageId, 'terraform-search', 'document language should be `terraform-search`');
    });

    test('completes blocks available for search files', async () => {
      const expected = [
        new vscode.CompletionItem('list', vscode.CompletionItemKind.Class),
        new vscode.CompletionItem('locals', vscode.CompletionItemKind.Class),
        new vscode.CompletionItem('provider', vscode.CompletionItemKind.Class),
        new vscode.CompletionItem('variable', vscode.CompletionItemKind.Class),
      ];

      await testCompletion(docUri, new vscode.Position(1, 0), {
        items: expected,
      });
    });
  });

  suite('list', function suite() {
    const docUri = getDocUri('main.tfquery.hcl');

    this.beforeAll(async () => {
      await open(docUri);
      await activateExtension();
    });

    this.afterAll(async () => {
      await vscode.commands.executeCommand('workbench.action.closeAllEditors');
    });

    this.afterEach(async () => {
      // revert any changes made to the document after each test
      await vscode.commands.executeCommand('workbench.action.files.revert');
    });

    test('language is registered', async () => {
      const doc = await vscode.workspace.openTextDocument(docUri);
      assert.equal(doc.languageId, 'terraform-search', 'document language should be `terraform-search`');
    });

    test('completes attributes of list block - provider', async () => {
      const expected = [
        new vscode.CompletionItem('aws.this', vscode.CompletionItemKind.Variable),
        new vscode.CompletionItem('azurerm.this', vscode.CompletionItemKind.Variable),
      ];

      await testCompletion(docUri, new vscode.Position(24, 21), {
        items: expected,
      });
    });

    test('completes attributes of list block - number variable', async () => {
      const expected = [
        new vscode.CompletionItem('count.index', vscode.CompletionItemKind.Variable),
        new vscode.CompletionItem('local.number_local', vscode.CompletionItemKind.Variable),
        new vscode.CompletionItem('var.number_variable', vscode.CompletionItemKind.Variable),
      ];

      await testCompletion(docUri, new vscode.Position(25, 21), {
        items: expected,
      });
    });

    test('completes attributes of list block - boolean variable', async () => {
      const expected = [
        new vscode.CompletionItem('false', vscode.CompletionItemKind.EnumMember),
        new vscode.CompletionItem('true', vscode.CompletionItemKind.EnumMember),
        new vscode.CompletionItem('var.boolean_variable', vscode.CompletionItemKind.Variable),
      ];

      await testCompletion(docUri, new vscode.Position(26, 21), {
        items: expected,
      });
    });
  });
});
