/**
 * Copyright (c) HashiCorp, Inc.
 * SPDX-License-Identifier: MPL-2.0
 */

import * as vscode from 'vscode';
import { assert } from 'chai';
import { activateExtension, getDocUri, open, testCompletion, sleep } from '../../helper';
import { execSync } from 'child_process';

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
    });
  });
});
