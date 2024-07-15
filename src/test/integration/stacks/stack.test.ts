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

    teardown(async () => {
      await vscode.commands.executeCommand('workbench.action.closeAllEditors');
    });

    test('language is registered', async () => {
      const doc = await vscode.workspace.openTextDocument(docUri);
      assert.equal(doc.languageId, 'terraform-stack', 'document language should be `terraform-stack`');
    });

    test('completes blocks available for stacks files', async () => {
      const expected = [
        new vscode.CompletionItem('component', vscode.CompletionItemKind.Class),
        new vscode.CompletionItem('output', vscode.CompletionItemKind.Class),
        new vscode.CompletionItem('provider', vscode.CompletionItemKind.Class),
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

    teardown(async () => {
      await vscode.commands.executeCommand('workbench.action.closeAllEditors');
    });

    test('language is registered', async () => {
      const doc = await vscode.workspace.openTextDocument(docUri);
      assert.equal(doc.languageId, 'terraform-stack', 'document language should be `terraform-stack`');
    });

    test('completes attributes of component block', async () => {
      //       await vscode.window.activeTextEditor?.edit((editBuilder) => {
      //         editBuilder.insert(
      //           new vscode.Position(2, 0),
      //           `
      // component "test" {

      // }
      // `,
      //         );
      //       });

      const expected = [
        new vscode.CompletionItem('for_each', vscode.CompletionItemKind.Property),
        new vscode.CompletionItem('inputs', vscode.CompletionItemKind.Property),
        new vscode.CompletionItem('providers', vscode.CompletionItemKind.Property),
        new vscode.CompletionItem('source', vscode.CompletionItemKind.Property),
        new vscode.CompletionItem('version', vscode.CompletionItemKind.Property),
      ];

      // await testCompletion(docUri, new vscode.Position(4, 2), {
      await testCompletion(docUri, new vscode.Position(4, 12), {
        items: expected,
      });
    });

    // TODO: not implemented yet
    test.skip('completes inputs for local component', async () => {
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

    // TODO: not implemented yet
    test.skip('completes references to provider blocks', async () => {
      const expected = [
        new vscode.CompletionItem('archive', vscode.CompletionItemKind.Property),
        new vscode.CompletionItem('aws', vscode.CompletionItemKind.Property),
        new vscode.CompletionItem('local', vscode.CompletionItemKind.Property),
        new vscode.CompletionItem('random', vscode.CompletionItemKind.Property),
      ];

      await testCompletion(docUri, new vscode.Position(11, 22), {
        items: expected,
      });
    });

    // TODO implement this
    test.skip('completes references to provider block names', async () => {
      const expected = [new vscode.CompletionItem('this', vscode.CompletionItemKind.Property)];

      await testCompletion(docUri, new vscode.Position(11, 26), {
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

    teardown(async () => {
      await vscode.commands.executeCommand('workbench.action.closeAllEditors');
    });

    test('completes config and for_each blocks within provider', async () => {
      const expected = [
        new vscode.CompletionItem('config', vscode.CompletionItemKind.Property),
        new vscode.CompletionItem('for_each', vscode.CompletionItemKind.Property),
      ];

      await testCompletion(docUri, new vscode.Position(41, 0), {
        items: expected,
      });
    });
  });
});
