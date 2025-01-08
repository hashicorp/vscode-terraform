// Copyright (c) The OpenTofu Authors
// SPDX-License-Identifier: MPL-2.0
// Copyright (c) HashiCorp, Inc.
// SPDX-License-Identifier: MPL-2.0

import * as vscode from 'vscode';
import * as assert from 'assert';
import { activateExtension, getDocUri, open, testSymbols } from '../../helper';

suite('symbols', () => {
  suite('basic language symbols', function suite() {
    const docUri = getDocUri('sample.tf');

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

    test('returns symbols', async () => {
      await testSymbols(docUri, ['provider "vault"', 'resource "vault_auth_backend" "b"', 'module "local"']);
    });
  });
});
