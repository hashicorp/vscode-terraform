// Copyright (c) The OpenTofu Authors
// SPDX-License-Identifier: MPL-2.0
// Copyright (c) HashiCorp, Inc.
// SPDX-License-Identifier: MPL-2.0

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
      await vscode.commands.executeCommand('opentofu.initCurrent');
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

    /* test('completes resource not available in downloaded schema', async () => {
      const actualCompletionList = await vscode.commands.executeCommand<vscode.CompletionList>(
        'vscode.executeCompletionItemProvider',
        docUri,
        new vscode.Position(13, 25),
      );

      const item = actualCompletionList.items.find((item) => {
        if (item.label === 'aws_eip_domain_name') {
          return item;
        }
      });

      // aws_eip_domain_name was added in provider version 5.46.0 but we initialized with 5.45.0
      assert.isUndefined(item, 'aws_eip_domain_name should not be in completion list');
    });*/
  });

  // This test is skipped as it fails weirdly on CI. It works fine locally and on Windows and OS X in CI.
  // On Ubuntu it fails with the following behavior:
  // We have a matrix build running the tests on three different VS Code versions. When this test fails, it
  // fails on one or two of the VS Code versions, but not all three (so far). The weird thing is that the
  // succeeding job changes between commits and retries of the failed job continue to fail. The current suspicion
  // is that it is placed on some Ubuntu machine that has a different configuration than the others and that retries
  // will run on the same machine the job was assigned to initially.
  // When failing, it is missing the inputs for the module that should have been downloaded from the git repository
  // via Terraform init. There are no errors in the logs indicating anything wrong.
  suite.skip('with module schema from git', function suite() {
    const docUri = getDocUri('git_module.tf');

    this.beforeAll(async () => {
      await open(docUri);
      await activateExtension();

      // run terraform init command to download provider schema
      await vscode.commands.executeCommand('opentofu.initCurrent');
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

      await testCompletion(docUri, new vscode.Position(2, 5), {
        items: expected,
      });
    });
  });
});
