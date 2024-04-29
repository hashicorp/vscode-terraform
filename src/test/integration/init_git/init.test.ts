/**
 * Copyright (c) HashiCorp, Inc.
 * SPDX-License-Identifier: MPL-2.0
 */

import * as vscode from 'vscode';
import { assert } from 'chai';
import { activateExtension, getDocUri, open, testCompletion, sleep } from '../../helper';
import { execSync } from 'child_process';

suite('init git', () => {
  suite('with module schema from git', function suite() {
    const docUri = getDocUri('git_module.tf');

    this.beforeAll(async () => {
      await open(docUri);
      await activateExtension();

      // run terraform init command to download provider schema
      await vscode.commands.executeCommand('terraform.initCurrent');
      // wait for schema to be loaded
      await sleep(20_000);
    });

    this.afterAll(async () => {
      // remove .terraform directory
      const dotTerraform = getDocUri('.terraform');
      await vscode.workspace.fs.delete(dotTerraform, { recursive: true });
      // remove .terraform.lock.hcl
      const lockfile = getDocUri('.terraform.lock.hcl');
      await vscode.workspace.fs.delete(lockfile);
    });

    teardown(async () => {
      await vscode.commands.executeCommand('workbench.action.closeAllEditors');
    });

    test('language is registered', async () => {
      const doc = await vscode.workspace.openTextDocument(docUri);
      assert.equal(doc.languageId, 'terraform', 'document language should be `terraform`');
    });

    test('completes module from downloaded schema', async () => {
      const expected = [
        new vscode.CompletionItem('count', vscode.CompletionItemKind.Property),
        new vscode.CompletionItem('depends_on', vscode.CompletionItemKind.Property),
        new vscode.CompletionItem('for_each', vscode.CompletionItemKind.Property),
        new vscode.CompletionItem('prefix', vscode.CompletionItemKind.Property),
        new vscode.CompletionItem('providers', vscode.CompletionItemKind.Property),
        new vscode.CompletionItem('suffix', vscode.CompletionItemKind.Property),
        new vscode.CompletionItem('unique-include-numbers', vscode.CompletionItemKind.Property),
        new vscode.CompletionItem('unique-length', vscode.CompletionItemKind.Property),
        new vscode.CompletionItem('unique-seed', vscode.CompletionItemKind.Property),
        new vscode.CompletionItem('version', vscode.CompletionItemKind.Property),
        // snippets
        new vscode.CompletionItem({ label: 'fore', description: 'For Each' }, vscode.CompletionItemKind.Snippet),
        new vscode.CompletionItem({ label: 'module', description: 'Module' }, vscode.CompletionItemKind.Snippet),
        new vscode.CompletionItem({ label: 'output', description: 'Output' }, vscode.CompletionItemKind.Snippet),
        new vscode.CompletionItem(
          { label: 'provisioner', description: 'Provisioner' },
          vscode.CompletionItemKind.Snippet,
        ),
        new vscode.CompletionItem({ label: 'vare', description: 'Empty variable' }, vscode.CompletionItemKind.Snippet),
        new vscode.CompletionItem({ label: 'varm', description: 'Map variable' }, vscode.CompletionItemKind.Snippet),
      ];

      await testCompletion(docUri, new vscode.Position(2, 0), {
        items: expected,
      });
    });
  });
});
