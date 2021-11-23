import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import * as assert from 'assert';
import { expect } from 'chai';
import { downloadLS, lsNeedsInstall } from '../../installer/checker';

suite('ls installer', () => {
  teardown(async () => {});

  suite('should not install', async () => {
    test('if auto update disabled', async () => {
      await vscode.workspace
        .getConfiguration('extensions')
        .update('autoCheckUpdates', false, vscode.ConfigurationTarget.Global);

      const temp = require('temp').track();

      const version = 'latest';
      const binpath = temp.mkdirSync('foo');
      const binbin = path.resolve(binpath, 'terraform-ls.exe');
      fs.writeFileSync(binbin, '');

      const stgbinPath = temp.path();
      const extVersion = '2.16.0';

      const install = await lsNeedsInstall(binbin, stgbinPath, extVersion, version);

      expect(install).not.to.be.undefined;
      assert.strictEqual(install, false);

      await vscode.workspace
        .getConfiguration('extensions')
        .update('autoCheckUpdates', true, vscode.ConfigurationTarget.Global);
    });

    test('if staging bin path exists', async () => {
      const temp = require('temp').track();

      const version = 'latest';
      const binpath = temp.mkdirSync('foo');
      const binbin = path.resolve(binpath, 'terraform-ls.exe');

      const stgbinPath = temp.mkdirSync('foobar');
      const stgbinbin = path.resolve(stgbinPath, 'terraform-ls.exe');

      // fs.writeFileSync(binbin, '');
      await downloadLS(stgbinPath, '0.24.0', '2.14.0');


      const extVersion = '2.16.0';
      const install = await lsNeedsInstall(binbin, stgbinbin, extVersion, version);

      expect(install).not.to.be.undefined;
      assert.strictEqual(install, false);
    });
  });

  suite('should install', async () => {
    test('if there is no ls installed', async () => {
      await vscode.workspace
        .getConfiguration('editor')
        .update('codeActionsOnSave', { 'source.formatAll.terraform': true }, vscode.ConfigurationTarget.Workspace);

      const temp = require('temp').track();

      const version = 'latest';
      const binPath = temp.path();
      const stgbinPath = temp.path();
      const extVersion = '2.16.0';
      const install = await lsNeedsInstall(binPath, stgbinPath, extVersion, version);

      expect(install).not.to.be.undefined;
      assert.ok(install);
    });

    test('if newer ls available', async () => {
      const temp = require('temp').track();

      const version = 'latest';
      const binpath = temp.mkdirSync('foo');
      const binbin = path.resolve(binpath, 'terraform-ls.exe');

      await downloadLS(binpath, '0.22.0', '2.14.0');

      const extVersion = '2.16.0';
      const stgbinPath = temp.path('foobar');
      const install = await lsNeedsInstall(binbin, stgbinPath, extVersion, version);

      expect(install).not.to.be.undefined;
      assert.strictEqual(install, true);
    });
  });
});
