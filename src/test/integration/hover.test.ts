/**
 * Copyright (c) HashiCorp, Inc.
 * SPDX-License-Identifier: MPL-2.0
 */

import * as vscode from 'vscode';
import * as assert from 'assert';
import { activateExtension, getDocUri, open, testHover } from '../helper';

suite('hover', () => {
  suite('core schema', function suite() {
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

    test('returns docs for terraform block', async () => {
      await testHover(docUri, new vscode.Position(0, 1), [
        new vscode.Hover(
          new vscode.MarkdownString(
            '**terraform** _Block_\n\nTerraform block used to configure some high-level behaviors of Terraform',
          ),
          new vscode.Range(new vscode.Position(14, 12), new vscode.Position(14, 20)),
        ),
      ]);
    });

    test('returns docs for google provider', async () => {
      await testHover(docUri, new vscode.Position(0, 1), [
        new vscode.Hover(
          new vscode.MarkdownString(
            '`google` hashicorp/google 5.24.0\n\nProvider Name\n\n[`google` on registry.terraform.io](https://registry.terraform.io/providers/hashicorp/google/5.24.0/docs?utm_content=documentHover\u0026utm_medium=Visual+Studio+Code+-+Insiders\u0026utm_source=terraform-ls)',
          ),
          new vscode.Range(new vscode.Position(14, 12), new vscode.Position(9, 12)),
        ),
      ]);
    });
  });
});
