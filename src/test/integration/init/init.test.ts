/**
 * Copyright (c) HashiCorp, Inc.
 * SPDX-License-Identifier: MPL-2.0
 */

import * as vscode from 'vscode';
import { assert } from 'chai';
import { activateExtension, getDocUri, open, testCompletion } from '../../helper';

suite('init', () => {
  suite('with bundled provider schema', function suite() {
    const docUri = getDocUri('main.tf');

    this.beforeAll(async () => {
      await open(docUri);
      await activateExtension();
    });

    teardown(async () => {
      await vscode.commands.executeCommand('workbench.action.closeAllEditors');
    });

    test('language is registered', async () => {
      const doc = await vscode.workspace.openTextDocument(docUri);
      assert.equal(doc.languageId, 'terraform', 'document language should be `terraform`');
    });

    test('completes resource available in bundled schema', async () => {
      // aws_eip_domain_name was added in provider version 5.46.0
      const expected = [new vscode.CompletionItem('aws_eip_domain_name', vscode.CompletionItemKind.Field)];

      await testCompletion(docUri, new vscode.Position(13, 26), {
        items: expected,
      });
    });
  });
});
