import * as assert from 'assert';
import * as vscode from 'vscode';
import { Utils } from 'vscode-uri';
import { TerraformExtension } from '../../extension';
import { getDocUri, getExtensionId, open, testFolderPath } from '../helper';



suite('moduleCallers', () => {
  teardown(async () => {
    await vscode.commands.executeCommand('workbench.action.closeAllEditors');
  });

	test('should execute language server command', async () => {
		const extId = getExtensionId()
		const ext = vscode.extensions.getExtension<TerraformExtension>(extId);

		const documentUri = getDocUri('modules/sample.tf');
		await open(documentUri);

    assert.ok(ext.isActive);

		const client = await ext.exports.handler.getClient();

		const moduleUri = Utils.dirname(documentUri).toString();
		const response = await ext.exports.moduleCallers(client, moduleUri);
		assert.strictEqual(response.moduleCallers.length, 1);
		assert.strictEqual(response.moduleCallers[0].uri, vscode.Uri.file(testFolderPath).toString(true));
	})
})

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
