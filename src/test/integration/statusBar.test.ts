import * as assert from 'assert';
import * as vscode from 'vscode';
import { expect } from 'chai';
import { terraformStatus, updateTerraformStatusBar } from '../../extension';
import { getDocUri, open } from '../helper';

suite('statusBar', () => {
  teardown(async () => {
    await vscode.commands.executeCommand('workbench.action.closeAllEditors');
  });

  test('should create a status bar item on activate', () => {
    assert.notStrictEqual(terraformStatus, undefined);
  });

  test('should create a status bar with the root module label', async () => {
    const documentUri = getDocUri('sample.tf');
    await open(documentUri);
    await updateTerraformStatusBar(documentUri);

    expect(terraformStatus.text).to.equal('$(refresh) testFixture');
  });

  test('should create an empty status bar inside a child module', async () => {
    const documentUri = getDocUri('modules/sample.tf');
    await open(documentUri);
    await updateTerraformStatusBar(documentUri);

    expect(terraformStatus.text).to.equal('');
  });
});
