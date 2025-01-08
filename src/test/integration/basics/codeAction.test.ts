// Copyright (c) The OpenTofu Authors
// SPDX-License-Identifier: MPL-2.0
// Copyright (c) HashiCorp, Inc.
// SPDX-License-Identifier: MPL-2.0

import * as vscode from 'vscode';
import * as assert from 'assert';
import { expect } from 'chai';
import { activateExtension, getDocUri, open, sleep } from '../../helper';

suite('code actions', () => {
  suite('format all', function suite() {
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

    test('formats the document', async () => {
      const supported = [
        new vscode.CodeAction('Format Document', vscode.CodeActionKind.Source.append('formatAll').append('terraform')),
      ];

      // wait till the LS is ready to accept a code action request
      await sleep(1000);

      for (let index = 0; index < supported.length; index++) {
        const wanted = supported[index];
        const requested = wanted.kind?.value.toString();

        const actions = await vscode.commands.executeCommand<vscode.CodeAction[]>(
          'vscode.executeCodeActionProvider',
          docUri,
          new vscode.Range(new vscode.Position(0, 0), new vscode.Position(0, 0)),
          requested,
        );

        assert.ok(actions);
        expect(actions).not.to.be.undefined;
        expect(wanted.kind?.value).not.to.be.undefined;

        //TODO: update format tests when laguage server ready
        //assert.strictEqual(actions.length, 1);
        //assert.strictEqual(actions[1].title, wanted.title);
        //assert.strictEqual(actions[0].kind?.value, wanted.kind?.value);
      }
    });
  });
});
