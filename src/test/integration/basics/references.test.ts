// Copyright (c) The OpenTofu Authors
// SPDX-License-Identifier: MPL-2.0
// Copyright (c) HashiCorp, Inc.
// SPDX-License-Identifier: MPL-2.0

import * as vscode from 'vscode';
import * as assert from 'assert';
import { activateExtension, getDocUri, open, testReferences } from '../../helper';

suite('references', () => {
  suite('module references', function suite() {
    const docUri = getDocUri('variables.tf');

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

    test('returns definition for module source', async () => {
      await testReferences(docUri, new vscode.Position(12, 10), [
        new vscode.Location(
          getDocUri('main.tf'),
          new vscode.Range(new vscode.Position(14, 12), new vscode.Position(14, 20)),
        ),
        new vscode.Location(
          getDocUri('terraform.tfvars'),
          new vscode.Range(new vscode.Position(0, 0), new vscode.Position(0, 4)),
        ),
      ]);
    });
  });
});
