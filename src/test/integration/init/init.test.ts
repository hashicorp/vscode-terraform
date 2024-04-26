/**
 * Copyright (c) HashiCorp, Inc.
 * SPDX-License-Identifier: MPL-2.0
 */

import * as vscode from 'vscode';
import { assert } from 'chai';
import { activateExtension, getDocUri, open, testCompletion, sleep } from '../../helper';

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

      await testCompletion(docUri, new vscode.Position(13, 25), {
        items: expected,
      });
    });
  });

  suite('with provider schema from init', function suite() {
    const docUri = getDocUri('main.tf');

    this.beforeAll(async () => {
      await open(docUri);
      await activateExtension();

      // run terraform init command to download provider schema
      await vscode.commands.executeCommand('terraform.initCurrent');
      // wait for schema to be loaded
      await sleep(5_000);
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

    test('completes resource not available in downloaded schema', async () => {
      // aws_eip_domain_name was added in provider version 5.46.0 but we initialized with 5.45.0
      const expected: vscode.CompletionItem[] = [];

      await testCompletion(docUri, new vscode.Position(13, 25), {
        items: expected,
      });
    });
  });

  suite('with module schema from git', function suite() {
    const docUri = getDocUri('git_module.tf');

    this.beforeAll(async () => {
      await open(docUri);
      await activateExtension();

      // run terraform init command to download provider schema
      await vscode.commands.executeCommand('terraform.initCurrent');
      // wait for schema to be loaded
      await sleep(5_000);
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
        new vscode.CompletionItem('allow_users_to_change_password', vscode.CompletionItemKind.Property),
        new vscode.CompletionItem('count', vscode.CompletionItemKind.Property),
        new vscode.CompletionItem('create_account_password_policy', vscode.CompletionItemKind.Property),
        new vscode.CompletionItem('depends_on', vscode.CompletionItemKind.Property),
        new vscode.CompletionItem('for_each', vscode.CompletionItemKind.Property),
        new vscode.CompletionItem('get_caller_identity', vscode.CompletionItemKind.Property),
        new vscode.CompletionItem('hard_expiry', vscode.CompletionItemKind.Property),
        new vscode.CompletionItem('max_password_age', vscode.CompletionItemKind.Property),
        new vscode.CompletionItem('minimum_password_length', vscode.CompletionItemKind.Property),
        new vscode.CompletionItem('password_reuse_prevention', vscode.CompletionItemKind.Property),
        new vscode.CompletionItem('providers', vscode.CompletionItemKind.Property),
        new vscode.CompletionItem('require_lowercase_characters', vscode.CompletionItemKind.Property),
        new vscode.CompletionItem('require_numbers', vscode.CompletionItemKind.Property),
        new vscode.CompletionItem('require_symbols', vscode.CompletionItemKind.Property),
        new vscode.CompletionItem('require_uppercase_characters', vscode.CompletionItemKind.Property),
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

      await testCompletion(docUri, new vscode.Position(2, 5), {
        items: expected,
      });
    });
  });
});
