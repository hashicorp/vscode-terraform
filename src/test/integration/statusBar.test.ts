import * as assert from 'assert';
import * as vscode from 'vscode';
import { expect } from 'chai';
import { terraformStatus } from '../../extension';
import { getDocUri, open } from '../helper';
import { sleep } from '../../utils';

suite('statusBar', () => {
  teardown(async () => {
    await vscode.commands.executeCommand('workbench.action.closeAllEditors');
  });

  test('should create a status bar item', () => {
    assert.notStrictEqual(terraformStatus, undefined);
  });

  test('should create a status bar with the root module label', async () => {
    const documentUri = getDocUri('sample.tf');
    await open(documentUri);
    await sleep(500);

    expect(terraformStatus.text).to.equal('$(refresh) testFixture');
  });

  test('should create an empty status bar inside a child module', async () => {
    const documentUri = getDocUri('modules/sample.tf');
    await open(documentUri);
    await sleep(500);

    expect(terraformStatus.text).to.equal('');
  });
});
