import * as vscode from 'vscode';
import * as assert from 'assert';
import { expect } from 'chai';
import { getDocUri, open } from '../helper';

suite('completion', () => {
  teardown(async () => {
    await vscode.commands.executeCommand('workbench.action.closeAllEditors');
  });

  test('simple completion', async () => {
    const wanted = new vscode.CompletionList([
      new vscode.CompletionItem('data', vscode.CompletionItemKind.Class),
      new vscode.CompletionItem('locals', vscode.CompletionItemKind.Class),
      new vscode.CompletionItem('module', vscode.CompletionItemKind.Class),
      new vscode.CompletionItem('output', vscode.CompletionItemKind.Class),
      new vscode.CompletionItem('provider', vscode.CompletionItemKind.Class),
      new vscode.CompletionItem('resource', vscode.CompletionItemKind.Class),
      new vscode.CompletionItem('terraform', vscode.CompletionItemKind.Class),
      new vscode.CompletionItem('variable', vscode.CompletionItemKind.Class),
      new vscode.CompletionItem({ label: 'fore', description: 'For Each' }, vscode.CompletionItemKind.Snippet),
      new vscode.CompletionItem({ label: 'module', description: 'Module' }, vscode.CompletionItemKind.Snippet),
      new vscode.CompletionItem({ label: 'output', description: 'Output' }, vscode.CompletionItemKind.Snippet),
      new vscode.CompletionItem(
        { label: 'provisioner', description: 'Provisioner' },
        vscode.CompletionItemKind.Snippet,
      ),
      new vscode.CompletionItem({ label: 'vare', description: 'Empty variable' }, vscode.CompletionItemKind.Snippet),
      new vscode.CompletionItem({ label: 'varm', description: 'Map variable' }, vscode.CompletionItemKind.Snippet),
    ]);

    const docUri = getDocUri('actions.tf');
    await open(docUri);

    const list = await vscode.commands.executeCommand<vscode.CompletionList>(
      'vscode.executeCompletionItemProvider',
      docUri,
      new vscode.Position(0, 0),
    );

    assert.ok(list);
    expect(list).not.to.be.undefined;
    expect(list.items).not.to.be.undefined;
    expect(list.items.length).to.be.greaterThanOrEqual(1);

    for (let index = 0; index < list.items.length; index++) {
      const element: vscode.CompletionItem = list.items[index];
      assert.ok(element);
      expect(element).not.to.be.undefined;

      const w = wanted.items[index];
      assert.ok(w);
      expect(w).not.to.be.undefined;
      assert.strictEqual(element.kind, w.kind);
      // this can either be a string or a vscode.CompletionItemLabel, so use deep
      assert.deepStrictEqual(element.label, w.label);
    }
  });
});
