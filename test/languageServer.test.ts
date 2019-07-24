import * as assert from 'assert';
import * as vscode from 'vscode';
import { ToggleLanguageServerCommand } from '../src/commands/toggleLanguageServer';
import { getConfiguration } from '../src/configuration';
import { InstallLanguageServerCommand } from '../src/commands/installLanguageServer';

suite("Language Server", () => {
  test("Install", async () => {
    try {
      await vscode.commands.executeCommand('terraform.' + InstallLanguageServerCommand.CommandName, '18762624');
      // await vscode.commands.executeCommand('terraform.' + ToggleLanguageServerCommand.CommandName);

      // assert.equal(getConfiguration().languageServer.enabled, true, "Expect language server to be enabled");
      // assert.equal(getConfiguration().indexing.enabled, false, "Expect indexing to be enabled");
    } finally {
      // await vscode.commands.executeCommand('terraform.' + ToggleLanguageServerCommand.CommandName);
    }
  }).timeout(100000); // the test runner does not wait for extension to load, the first test needs more time therefore
});