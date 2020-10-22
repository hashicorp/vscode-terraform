// Disabling test due to VSCode limitations - "Entering a new workspace is not possible in tests"

// import * as assert from 'assert';
// import * as vscode from 'vscode';
// import { getDocUri, open } from './helper';

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