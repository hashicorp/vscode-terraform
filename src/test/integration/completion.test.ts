/**
 * Copyright (c) HashiCorp, Inc.
 * SPDX-License-Identifier: MPL-2.0
 */

import * as vscode from 'vscode';
import { assert } from 'chai';
import { activateExtension, getDocUri, open, testCompletion } from '../helper';

const snippets = [
  new vscode.CompletionItem({ label: 'fore', description: 'For Each' }, vscode.CompletionItemKind.Snippet),
  new vscode.CompletionItem({ label: 'module', description: 'Module' }, vscode.CompletionItemKind.Snippet),
  new vscode.CompletionItem({ label: 'output', description: 'Output' }, vscode.CompletionItemKind.Snippet),
  new vscode.CompletionItem({ label: 'provisioner', description: 'Provisioner' }, vscode.CompletionItemKind.Snippet),
  new vscode.CompletionItem({ label: 'vare', description: 'Empty variable' }, vscode.CompletionItemKind.Snippet),
  new vscode.CompletionItem({ label: 'varm', description: 'Map variable' }, vscode.CompletionItemKind.Snippet),
];

suite('Language Server Completion', function suite() {
  const docUri = getDocUri('actions.tf');

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

  test('simple completion', async () => {
    const expected = [
      new vscode.CompletionItem('check', vscode.CompletionItemKind.Class),
      new vscode.CompletionItem('data', vscode.CompletionItemKind.Class),
      new vscode.CompletionItem('import', vscode.CompletionItemKind.Class),
      new vscode.CompletionItem('locals', vscode.CompletionItemKind.Class),
      new vscode.CompletionItem('module', vscode.CompletionItemKind.Class),
      new vscode.CompletionItem('moved', vscode.CompletionItemKind.Class),
      new vscode.CompletionItem('output', vscode.CompletionItemKind.Class),
      new vscode.CompletionItem('provider', vscode.CompletionItemKind.Class),
      new vscode.CompletionItem('removed', vscode.CompletionItemKind.Class),
      new vscode.CompletionItem('resource', vscode.CompletionItemKind.Class),
      new vscode.CompletionItem('terraform', vscode.CompletionItemKind.Class),
      new vscode.CompletionItem('variable', vscode.CompletionItemKind.Class),
    ];
    // expected.push(...snippets);
    await testCompletion(docUri, new vscode.Position(0, 0), {
      items: expected,
    });
  });
});

suite('Module Completion', function suite() {
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

  // Completion for inputs of a local module
  test('inputs of a local module', async () => {
    const expected = [
      new vscode.CompletionItem('count', vscode.CompletionItemKind.Property),
      new vscode.CompletionItem('depends_on', vscode.CompletionItemKind.Property),
      new vscode.CompletionItem('for_each', vscode.CompletionItemKind.Property),
      new vscode.CompletionItem('machine_type', vscode.CompletionItemKind.Property),
      new vscode.CompletionItem('providers', vscode.CompletionItemKind.Property),
      new vscode.CompletionItem('version', vscode.CompletionItemKind.Property),
    ];
    expected.push(...snippets);

    await testCompletion(docUri, new vscode.Position(21, 0), {
      items: expected,
    });
  });

  // Completion for a local module sources (prefix ./)
  test('local module sources', async () => {
    const expected = [
      new vscode.CompletionItem('"./ai"', vscode.CompletionItemKind.Text),
      new vscode.CompletionItem('"./compute"', vscode.CompletionItemKind.Text),
      new vscode.CompletionItem('"cloudposse/label/null"', vscode.CompletionItemKind.Text),
      new vscode.CompletionItem('"terraform-aws-modules/eks/aws"', vscode.CompletionItemKind.Text),
      new vscode.CompletionItem('"terraform-aws-modules/iam/aws"', vscode.CompletionItemKind.Text),
      new vscode.CompletionItem('"terraform-aws-modules/kms/aws"', vscode.CompletionItemKind.Text),
      new vscode.CompletionItem('"terraform-aws-modules/lambda/aws"', vscode.CompletionItemKind.Text),
      new vscode.CompletionItem('"terraform-aws-modules/rds/aws"', vscode.CompletionItemKind.Text),
      new vscode.CompletionItem('"terraform-aws-modules/s3-bucket/aws"', vscode.CompletionItemKind.Text),
      new vscode.CompletionItem('"terraform-aws-modules/security-group/aws"', vscode.CompletionItemKind.Text),
      new vscode.CompletionItem('"terraform-aws-modules/vpc/aws"', vscode.CompletionItemKind.Text),
      new vscode.CompletionItem('"terraform-google-modules/project-factory/google"', vscode.CompletionItemKind.Text),
    ];
    expected.push(...snippets);

    // module "compute" {
    //   source = "./compute"
    await testCompletion(docUri, new vscode.Position(18, 11), {
      items: expected,
    });
  });
});

suite('TFVars Completion', function suite() {
  const docUri = getDocUri('terraform.tfvars');

  this.beforeAll(async () => {
    await open(docUri);
    await activateExtension();
  });

  teardown(async () => {
    await vscode.commands.executeCommand('workbench.action.closeAllEditors');
  });

  test('language is registered', async () => {
    const doc = await vscode.workspace.openTextDocument(docUri);
    assert.equal(doc.languageId, 'terraform-vars', 'document language should be `terraform-vars`');
  });

  test('simple variable completion', async () => {
    const expected = [
      new vscode.CompletionItem('credentials_file', vscode.CompletionItemKind.Property),
      new vscode.CompletionItem('project', vscode.CompletionItemKind.Property),
      new vscode.CompletionItem('region', vscode.CompletionItemKind.Property),
    ];
    expected.push(...snippets);
    await testCompletion(docUri, new vscode.Position(1, 0), {
      items: expected,
    });
  });
});
