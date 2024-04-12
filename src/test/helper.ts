/**
 * Copyright (c) HashiCorp, Inc.
 * SPDX-License-Identifier: MPL-2.0
 */

import * as vscode from 'vscode';
import * as path from 'path';
import * as assert from 'assert';

export async function open(docUri: vscode.Uri): Promise<void> {
  try {
    const doc = await vscode.workspace.openTextDocument(docUri);
    await vscode.window.showTextDocument(doc);
  } catch (e) {
    console.error(e);
    throw e;
  }
}

export const getDocUri = (p: string): vscode.Uri => {
  const documentPath = path.resolve(__dirname, '../../test/fixtures', p);
  return vscode.Uri.file(documentPath);
};

export async function testCompletion(
  docUri: vscode.Uri,
  position: vscode.Position,
  expectedCompletionList: vscode.CompletionList,
) {
  const actualCompletionList = await vscode.commands.executeCommand<vscode.CompletionList>(
    'vscode.executeCompletionItemProvider',
    docUri,
    position,
  );

  assert.deepStrictEqual(actualCompletionList.items.length, expectedCompletionList.items.length);
  expectedCompletionList.items.forEach((expectedItem, i) => {
    const actualItem = actualCompletionList.items[i];
    assert.deepStrictEqual(actualItem.label, expectedItem.label);
    assert.deepStrictEqual(actualItem.kind, expectedItem.kind);
  });
}

export async function testHover(docUri: vscode.Uri, position: vscode.Position, expectedCompletionList: vscode.Hover[]) {
  const actualhover = await vscode.commands.executeCommand<vscode.Hover[]>(
    'vscode.executeHoverProvider',
    docUri,
    position,
  );

  assert.equal(actualhover.length, expectedCompletionList.length);
  expectedCompletionList.forEach((expectedItem, i) => {
    const actualItem = actualhover[i];
    assert.deepStrictEqual(actualItem.contents, expectedItem.contents);
  });
}

export async function testDefinitions(
  docUri: vscode.Uri,
  position: vscode.Position,
  expectedDefinitions: vscode.Location[],
) {
  const actualDefinitions = await vscode.commands.executeCommand<vscode.Location[] | vscode.LocationLink[]>(
    'vscode.executeDefinitionProvider',
    docUri,
    position,
  );

  assert.equal(actualDefinitions.length, expectedDefinitions.length);
  expectedDefinitions.forEach((expectedItem, i) => {
    const actualItem = actualDefinitions[i];
    if (actualItem instanceof vscode.Location) {
      assert.deepStrictEqual(actualItem.uri.path, expectedItem.uri.path);
      assert.deepStrictEqual(actualItem.range.start, expectedItem.range.start);
      assert.deepStrictEqual(actualItem.range.end, expectedItem.range.end);
      return;
    } else {
      // } else if (actualItem instanceof vscode.LocationLink) {
      assert.deepStrictEqual(actualItem.targetUri.path, expectedItem.uri.path);
      assert.deepStrictEqual(actualItem.targetRange.start, expectedItem.range.start);
      assert.deepStrictEqual(actualItem.targetRange.end, expectedItem.range.end);
    }
  });
}

export async function testReferences(
  docUri: vscode.Uri,
  position: vscode.Position,
  expectedDefinitions: vscode.Location[],
) {
  const actualDefinitions = await vscode.commands.executeCommand<vscode.Location[]>(
    'vscode.executeReferenceProvider',
    docUri,
    position,
  );

  assert.equal(actualDefinitions.length, expectedDefinitions.length);
  expectedDefinitions.forEach((expectedItem, i) => {
    const actualItem = actualDefinitions[i];
    assert.deepStrictEqual(actualItem.uri.path, expectedItem.uri.path);
    assert.deepStrictEqual(actualItem.range.start, expectedItem.range.start);
    assert.deepStrictEqual(actualItem.range.end, expectedItem.range.end);
  });
}

export async function testSymbols(docUri: vscode.Uri, symbolNames: string[]) {
  const symbols = await vscode.commands.executeCommand<vscode.SymbolInformation[]>(
    'vscode.executeDocumentSymbolProvider',
    docUri,
  );

  assert.strictEqual(symbols.length, symbolNames.length);
  symbols.forEach((symbol, i) => {
    assert.strictEqual(symbol.name, symbolNames[i]);
  });
}

export async function activateExtension() {
  const ext = vscode.extensions.getExtension('hashicorp.terraform');
  if (!ext?.isActive) {
    await ext?.activate();
    sleep(1000);
  }
}

export async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
