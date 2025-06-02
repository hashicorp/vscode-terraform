/**
 * Copyright (c) HashiCorp, Inc.
 * SPDX-License-Identifier: MPL-2.0
 */

import * as vscode from 'vscode';
import { assert } from 'chai';
import { activateExtension, getDocUri, open, testCompletion } from '../../helper';

suite('stacks deployments', () => {
  suite('basics', function () {
    const docUri = getDocUri('deployments.tfdeploy.hcl');

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
      assert.equal(doc.languageId, 'terraform-deploy', 'document language should be `terraform-deploy`');
    });

    test('completes inputs attribute in deployment block', async () => {
      // add a new incomplete "test" deployment block to use for completions
      await vscode.window.activeTextEditor?.edit((editBuilder) => {
        editBuilder.insert(
          new vscode.Position(14, 0),
          `
deployment "test" {

}
`,
        );
      });

      const expected = [new vscode.CompletionItem('inputs', vscode.CompletionItemKind.Property)];

      await testCompletion(docUri, new vscode.Position(16, 2), {
        items: expected,
      });
    });

    test('completes available inputs in deployment block', async () => {
      // add a new incomplete "test" deployment block to use for completions
      await vscode.window.activeTextEditor?.edit((editBuilder) => {
        editBuilder.insert(
          new vscode.Position(14, 0),
          `
deployment "test" {
  inputs = {

  }
}
`,
        );
      });

      const expected = [
        new vscode.CompletionItem('default_tags', vscode.CompletionItemKind.Property),
        new vscode.CompletionItem('identity_token_file', vscode.CompletionItemKind.Property),
        new vscode.CompletionItem('region', vscode.CompletionItemKind.Property),
        new vscode.CompletionItem('role_arn', vscode.CompletionItemKind.Property),
      ];

      await testCompletion(docUri, new vscode.Position(17, 2), {
        items: expected,
      });
    });

    test('completes attributes of identity_token block', async () => {
      // add a new incomplete deployment block to use for completions
      await vscode.window.activeTextEditor?.edit((editBuilder) => {
        editBuilder.insert(
          new vscode.Position(14, 0),
          `
deployment "test" {
  inputs = {
    identity_token_file = identity_token.aws.
  }
}
`,
        );
      });

      const expected = [
        new vscode.CompletionItem('identity_token.aws.audience', vscode.CompletionItemKind.Variable),
        new vscode.CompletionItem('identity_token.aws.jwt', vscode.CompletionItemKind.Variable),
        new vscode.CompletionItem('identity_token.aws.jwt_filename', vscode.CompletionItemKind.Variable),
      ];

      await testCompletion(docUri, new vscode.Position(17, 45), {
        items: expected,
      });
    });

    test('completes audience in identity_token block', async () => {
      // add a new incomplete "account_3" identity_token block to use for completions
      await vscode.window.activeTextEditor?.edit((editBuilder) => {
        editBuilder.insert(new vscode.Position(14, 0), 'identity_token "test" {\n\n}\n');
      });

      const expected = [new vscode.CompletionItem('audience', vscode.CompletionItemKind.Property)];

      await testCompletion(docUri, new vscode.Position(15, 2), {
        items: expected,
      });
    });

    // TODO: not implemented yet
    test.skip('completes valid rule types of an orchestrate block', async () => {
      await vscode.window.activeTextEditor?.edit((editBuilder) => {
        editBuilder.insert(new vscode.Position(14, 0), 'orchestrate ""\n\n');
      });

      const expected = [new vscode.CompletionItem('auto_approve', vscode.CompletionItemKind.Property)];

      await testCompletion(docUri, new vscode.Position(14, 13), {
        items: expected,
      });
    });

    suite('orchestrate block context', function () {
      this.beforeAll(async () => {
        await vscode.window.activeTextEditor?.edit((editBuilder) => {
          editBuilder.insert(
            new vscode.Position(14, 0),
            `
  orchestrate "auto_approve" "no_api_gateway_changes" {
    check {
      condition = context.plan.component_changes["component.api_gateway"].total == 0
      reason = "Changes proposed to api_gateway component."
    }
  }
  `,
          );
        });
      });

      test.skip('completes context', async () => {
        const generateSubChanges = (label: string) => [
          new vscode.CompletionItem(label, vscode.CompletionItemKind.Variable),
          new vscode.CompletionItem(`${label}.add`, vscode.CompletionItemKind.Variable),
          new vscode.CompletionItem(`${label}.change`, vscode.CompletionItemKind.Variable),
          new vscode.CompletionItem(`${label}.defer`, vscode.CompletionItemKind.Variable),
          new vscode.CompletionItem(`${label}.forget`, vscode.CompletionItemKind.Variable),
          new vscode.CompletionItem(`${label}.import`, vscode.CompletionItemKind.Variable),
          new vscode.CompletionItem(`${label}.move`, vscode.CompletionItemKind.Variable),
          new vscode.CompletionItem(`${label}.remove`, vscode.CompletionItemKind.Variable),
          new vscode.CompletionItem(`${label}.total`, vscode.CompletionItemKind.Variable),
        ];

        const expected = [
          new vscode.CompletionItem('context.errors', vscode.CompletionItemKind.Variable),
          new vscode.CompletionItem('context.operation', vscode.CompletionItemKind.Variable),
          new vscode.CompletionItem('context.plan', vscode.CompletionItemKind.Variable),
          new vscode.CompletionItem('context.plan.applyable', vscode.CompletionItemKind.Variable),
          ...generateSubChanges('context.plan.changes'),
          ...generateSubChanges('context.plan.component_changes["api_gateway"]'),
          ...generateSubChanges('context.plan.component_changes["foo"]'),
          ...generateSubChanges('context.plan.component_changes["lambda"]'),
          ...generateSubChanges('context.plan.component_changes["s3"]'),
          new vscode.CompletionItem('context.plan.deployment', vscode.CompletionItemKind.Variable),
          new vscode.CompletionItem('context.plan.mode', vscode.CompletionItemKind.Variable),
          new vscode.CompletionItem('context.plan.replans', vscode.CompletionItemKind.Variable),
          new vscode.CompletionItem('context.success', vscode.CompletionItemKind.Variable),
          new vscode.CompletionItem('context.warnings', vscode.CompletionItemKind.Variable),
        ];

        await testCompletion(docUri, new vscode.Position(17, 26), {
          items: expected,
        });
      });
    });
  });
});
