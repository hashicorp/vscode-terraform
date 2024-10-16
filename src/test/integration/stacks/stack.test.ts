/**
 * Copyright (c) HashiCorp, Inc.
 * SPDX-License-Identifier: MPL-2.0
 */

import * as vscode from 'vscode';
import { assert } from 'chai';
import { activateExtension, getDocUri, open, testCompletion } from '../../helper';

suite('stacks stack', () => {
  suite('root', function suite() {
    const docUri = getDocUri('variables.tfstack.hcl');

    this.beforeAll(async () => {
      await open(docUri);
      await activateExtension();
    });

    this.afterAll(async () => {
      await vscode.commands.executeCommand('workbench.action.closeAllEditors');
    });

    test('language is registered', async () => {
      const doc = await vscode.workspace.openTextDocument(docUri);
      assert.equal(doc.languageId, 'terraform-stack', 'document language should be `terraform-stack`');
    });

    test('completes blocks available for stacks files', async () => {
      const expected = [
        new vscode.CompletionItem('component', vscode.CompletionItemKind.Class),
        new vscode.CompletionItem('locals', vscode.CompletionItemKind.Class),
        new vscode.CompletionItem('output', vscode.CompletionItemKind.Class),
        new vscode.CompletionItem('provider', vscode.CompletionItemKind.Class),
        new vscode.CompletionItem('removed', vscode.CompletionItemKind.Class),
        new vscode.CompletionItem('required_providers', vscode.CompletionItemKind.Class),
        new vscode.CompletionItem('variable', vscode.CompletionItemKind.Class),
      ];

      await testCompletion(docUri, new vscode.Position(20, 0), {
        items: expected,
      });
    });
  });

  suite('components', function suite() {
    const docUri = getDocUri('components.tfstack.hcl');

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
      assert.equal(doc.languageId, 'terraform-stack', 'document language should be `terraform-stack`');
    });

    test('completes attributes of component block', async () => {
      const expected = [
        new vscode.CompletionItem('depends_on', vscode.CompletionItemKind.Property),
        new vscode.CompletionItem('for_each', vscode.CompletionItemKind.Property),
        new vscode.CompletionItem('inputs', vscode.CompletionItemKind.Property),
        new vscode.CompletionItem('providers', vscode.CompletionItemKind.Property),
        new vscode.CompletionItem('source', vscode.CompletionItemKind.Property),
        new vscode.CompletionItem('version', vscode.CompletionItemKind.Property),
      ];

      await testCompletion(docUri, new vscode.Position(4, 12), {
        items: expected,
      });
    });

    test('completes inputs for local component', async () => {
      await vscode.window.activeTextEditor?.edit((editBuilder) => {
        editBuilder.insert(
          new vscode.Position(2, 0),
          `
component "test" {
  source = "./lambda"

  inputs = {

  }
}
    `,
        );
      });

      const expected = [new vscode.CompletionItem('bucket_id', vscode.CompletionItemKind.Property)];

      await testCompletion(docUri, new vscode.Position(7, 4), {
        items: expected,
      });
    });

    test('completes providers for local component', async () => {
      await vscode.window.activeTextEditor?.edit((editBuilder) => {
        editBuilder.insert(
          new vscode.Position(2, 0),
          `
component "test" {
  source = "./lambda"

  providers = {

  }
}
    `,
        );
      });

      const expected = [
        new vscode.CompletionItem('archive', vscode.CompletionItemKind.Property),
        new vscode.CompletionItem('aws', vscode.CompletionItemKind.Property),
        new vscode.CompletionItem('local', vscode.CompletionItemKind.Property),
        new vscode.CompletionItem('random', vscode.CompletionItemKind.Property),
      ];

      await testCompletion(docUri, new vscode.Position(7, 4), {
        items: expected,
      });
    });

    test('completes references to providers', async () => {
      await vscode.window.activeTextEditor?.edit((editBuilder) => {
        editBuilder.insert(
          new vscode.Position(2, 0),
          `
component "test" {
  source = "./lambda"

  providers = {
    aws = provider.
  }
}
    `,
        );
      });

      const expected = [
        new vscode.CompletionItem('provider.archive.this', vscode.CompletionItemKind.Variable),
        new vscode.CompletionItem('provider.aws.this', vscode.CompletionItemKind.Variable),
        new vscode.CompletionItem('provider.local.this', vscode.CompletionItemKind.Variable),
        new vscode.CompletionItem('provider.random.this', vscode.CompletionItemKind.Variable),
      ];
      await testCompletion(docUri, new vscode.Position(7, 19), {
        items: expected,
      });
    });
  });

  suite('providers', function suite() {
    const docUri = getDocUri('providers.tfstack.hcl');

    this.beforeAll(async () => {
      await open(docUri);
      await activateExtension();
    });

    this.afterAll(async () => {
      await vscode.commands.executeCommand('workbench.action.closeAllEditors');
    });

    test('completes config and for_each blocks within provider', async () => {
      const expected = [
        new vscode.CompletionItem('config', vscode.CompletionItemKind.Class),
        new vscode.CompletionItem('for_each', vscode.CompletionItemKind.Property),
      ];

      await testCompletion(docUri, new vscode.Position(41, 0), {
        items: expected,
      });
    });
  });
});
