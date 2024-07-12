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

    test('completes variables attribute in deployment block', async () => {
      // add a new incomplete "test" deployment block to use for completions
      await vscode.window.activeTextEditor?.edit((editBuilder) => {
        editBuilder.insert(new vscode.Position(14, 0), 'deployment "test" {\n\n}\n');
      });

      const expected = [new vscode.CompletionItem('variables', vscode.CompletionItemKind.Property)];

      await testCompletion(docUri, new vscode.Position(15, 2), {
        items: expected,
      });
    });

    // TODO: not implemented yet
    test.skip('completes available variables in deployment block', async () => {
      // add a new incomplete "test" deployment block to use for completions
      await vscode.window.activeTextEditor?.edit((editBuilder) => {
        editBuilder.insert(new vscode.Position(14, 0), 'deployment "test" {\nvariables = {\n\n}\n}\n');
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

    // TODO: not implemented yet
    test.skip('completes attributes of identity_token block', async () => {
      // add a new incomplete deployment block to use for completions
      await vscode.window.activeTextEditor?.edit((editBuilder) => {
        editBuilder.insert(
          new vscode.Position(14, 0),
          `
deployment "test" {
  variables = {
    identity_token_file = identity_token.aws.
  }
}
`,
        );
      });

      const expected = [new vscode.CompletionItem('jwt_filename', vscode.CompletionItemKind.Property)];

      await testCompletion(docUri, new vscode.Position(17, 45), {
        items: expected,
      });
    });

    test('completes audience in identity_token block', async () => {
      // add a new incomplete "account_3" identity_token block to use for completions
      await vscode.window.activeTextEditor?.edit((editBuilder) => {
        editBuilder.insert(new vscode.Position(14, 0), 'identity_token {\n\n}\n');
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

      // TODO: not implemented yet
      test.skip('completes context root level', async () => {
        const expected = [
          new vscode.CompletionItem('errors', vscode.CompletionItemKind.Property),
          new vscode.CompletionItem('operation', vscode.CompletionItemKind.Property),
          new vscode.CompletionItem('plan', vscode.CompletionItemKind.Property),
          new vscode.CompletionItem('warnings', vscode.CompletionItemKind.Property),
        ];

        await testCompletion(docUri, new vscode.Position(17, 26), {
          items: expected,
        });
      });

      // TODO: not implemented yet
      test.skip('completes context.plan level', async () => {
        const expected = [
          new vscode.CompletionItem('applyable', vscode.CompletionItemKind.Property),
          new vscode.CompletionItem('changes', vscode.CompletionItemKind.Property),
          new vscode.CompletionItem('component_changes', vscode.CompletionItemKind.Property),
          new vscode.CompletionItem('deployment', vscode.CompletionItemKind.Property),
          new vscode.CompletionItem('mode', vscode.CompletionItemKind.Property),
          new vscode.CompletionItem('replans', vscode.CompletionItemKind.Property),
        ];

        await testCompletion(docUri, new vscode.Position(17, 31), {
          items: expected,
        });
      });

      // TODO: not implemented yet
      test.skip('completes context.plan.component_changes item level', async () => {
        const expected = [
          new vscode.CompletionItem('add', vscode.CompletionItemKind.Property),
          new vscode.CompletionItem('change', vscode.CompletionItemKind.Property),
          new vscode.CompletionItem('import', vscode.CompletionItemKind.Property),
          new vscode.CompletionItem('remove', vscode.CompletionItemKind.Property),
          new vscode.CompletionItem('total', vscode.CompletionItemKind.Property),
        ];

        await testCompletion(docUri, new vscode.Position(17, 74), {
          items: expected,
        });
      });
    });
  });
});
