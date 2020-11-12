import * as vscode from 'vscode';
import * as assert from 'assert';
import { getDocUri, open } from './helper';

suite('document symbols', () => {
	const docUri = getDocUri('sample.tf');

	test('returns symbols', async () => {
		await testSymbols(docUri, ['provider "vault"', 'resource "vault_auth_backend" "b"']);
	});
});

async function testSymbols(docUri: vscode.Uri, symbolNames: string[]) {
	await open(docUri);
	// Executing the command `vscode.executeDocumentSymbolProvider` to simulate requesting doc symbols
	const symbols = (await vscode.commands.executeCommand('vscode.executeDocumentSymbolProvider', docUri)) as vscode.SymbolInformation[];

	assert.ok(symbols.length === symbolNames.length);
	symbols.forEach((symbol, i) => {
		assert.equal(symbol.name, symbolNames[i]);
	});
}