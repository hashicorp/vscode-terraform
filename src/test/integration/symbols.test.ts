import * as vscode from 'vscode';
import * as assert from 'assert';
import { expect } from 'chai';
import { getDocUri, open } from '../helper';

suite('document symbols', () => {
  teardown(async () => {
    return await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
  });

  const docUri = getDocUri('sample.tf');

  test('returns symbols', async () => {
    await testSymbols(docUri, ['provider "vault"', 'resource "vault_auth_backend" "b"', 'module "local"']);
  });
});

async function testSymbols(docUri: vscode.Uri, symbolNames: string[]) {
  await open(docUri);
  // Executing the command `vscode.executeDocumentSymbolProvider` to simulate requesting doc symbols
  const symbols = (await vscode.commands.executeCommand(
    'vscode.executeDocumentSymbolProvider',
    docUri,
  )) as vscode.SymbolInformation[];

  assert.ok(symbols);
  expect(symbols).not.to.be.undefined;

  assert.strictEqual(symbols.length, symbolNames.length);
  symbols.forEach((symbol, i) => {
    assert.strictEqual(symbol.name, symbolNames[i]);
  });
}
