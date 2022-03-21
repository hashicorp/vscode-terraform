import * as assert from 'assert';
import * as vscode from 'vscode';
import { Utils } from 'vscode-uri';
import { moduleCallers } from '../../extension';
import { getDocUri, open, testFolderPath } from '../helper';

suite('moduleCallers', () => {
  teardown(async () => {
    await vscode.commands.executeCommand('workbench.action.closeAllEditors');
  });

  test('should execute language server command', async () => {
    const documentUri = getDocUri('modules/sample.tf');
    await open(documentUri);

    const moduleUri = Utils.dirname(documentUri).toString();
    const response = await moduleCallers(moduleUri);
    assert.ok(response);

    assert.strictEqual(response.moduleCallers.length, 1);
    assert.strictEqual(
      // ensure both URIs are normalized, which is what VSCode would do anyway
      // see https://github.com/microsoft/vscode/issues/42159#issuecomment-360533151
      vscode.Uri.parse(response.moduleCallers[0].uri).toString(true),
      vscode.Uri.file(testFolderPath).toString(true),
    );
  });
});

// Disabling test due to VSCode limitations - "Entering a new workspace is not possible in tests"
// suite('workspace folders', () => {
// 	const docUri = getDocUri('sample.tf');
// 	const folder = getDocUri('modules/');

// 	test('should only have one client for nested workspace folders', async () => {
// 		await addNestedWorkspaces(docUri, folder);
// 	});
// });

// async function addNestedWorkspaces(docUri: vscode.Uri, folderUri: vscode.Uri) {
// 	const ext = vscode.extensions.getExtension('hashicorp.terraform');
// 	await open(docUri);

// 	assert.ok(vscode.workspace.updateWorkspaceFolders(1, null, { uri: folderUri }));
// 	const clients = ext.exports.clients;
// 	assert.strictEqual(clients.size, 1);
// 	assert.strictEqual(vscode.workspace.workspaceFolders.length, 2);
// }
