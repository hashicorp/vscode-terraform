import * as vscode from 'vscode';
import * as assert from 'assert';
import { getDocUri, activate } from './helper';

suite('Should return document symbols', () => {
	const docUri = getDocUri('sample.tf');

	test('returns symbols', async () => {
		await testSymbols(docUri, ['provider.vault', 'resource.vault_auth_backend.b']);
	});
});

async function testSymbols(docUri: vscode.Uri, symbolNames: string[]) {
	await activate(docUri);
	// Executing the command `vscode.executeDocumentSymbolProvider` to simulate triggering completion
	const symbols = (await vscode.commands.executeCommand('vscode.executeDocumentSymbolProvider', docUri)) as vscode.SymbolInformation[];
	console.log(symbols);

	assert.ok(symbols.length === symbolNames.length);
	symbols.forEach((symbol, i) => {
		assert.equal(symbol.name, symbolNames[i]);
	});
}