// import * as vscode from 'vscode';
// import * as assert from 'assert';
// import { expect } from 'chai';
// import { getDocUri, open } from '../helper';
// import { config } from '../../vscodeUtils';

// Enable when https://github.com/hashicorp/terraform-ls/pull/680 is merged
// suite('code actions', () => {
//   teardown(async () => {
//     await vscode.commands.executeCommand('workbench.action.closeAllEditors');
//   });

//   test('supported actions', async () => {
//     await vscode.workspace
//       .getConfiguration('terraform')
//       .update('languageServer', { external: true }, vscode.ConfigurationTarget.Workspace);
//     await vscode.workspace
//       .getConfiguration('editor')
//       .update('codeActionsOnSave', { "source.formatAll.terraform": true }, vscode.ConfigurationTarget.Workspace);

//     const docUri = getDocUri('actions.tf');
//     await open(docUri);

//     const supported = [
//       new vscode.CodeAction('Format Document', vscode.CodeActionKind.Source.append('formatAll').append('terraform')),
//     ];

//     for (let index = 0; index < supported.length; index++) {
//       const wanted = supported[index];
//       const requested = wanted.kind.value.toString();

//       const actions: vscode.CodeAction[] = await vscode.commands.executeCommand<vscode.CodeAction[]>(
//         'vscode.executeCodeActionProvider',
//         docUri,
//         new vscode.Range(new vscode.Position(0, 0), new vscode.Position(0, 0)),
//         requested,
//       );

//       assert.ok(actions);
//       expect(actions).not.to.be.undefined;

//       assert.strictEqual(actions.length, 1);
//       assert.strictEqual(actions[0].title, wanted.title);
//       assert.strictEqual(actions[0].kind.value, wanted.kind.value);
//     }
//   });
// });
