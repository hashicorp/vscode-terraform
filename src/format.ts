import * as vscode from 'vscode';
import { exec } from 'child_process';

import { stripAnsi } from './ansi';
import { isTerraformDocument } from './helpers';
import { outputChannel } from './extension';

export class FormatOnSaveHandler {
  private _ignoreNextSave = new WeakSet<vscode.TextDocument>();
  private _configuration = vscode.workspace.getConfiguration('terraform');

  static create() {
    let handler = new FormatOnSaveHandler;

    return vscode.workspace.onDidSaveTextDocument((doc) => handler.onSave(doc));
  }

  onSave(document: vscode.TextDocument) {
    if (!isTerraformDocument(document) || this._ignoreNextSave.has(document)) {
      return;
    }

    let textEditor = vscode.window.activeTextEditor;

    if (this.isFormatOnSaveEnabled(document) && textEditor.document === document) {
      const fullRange = doc => doc.validateRange(new vscode.Range(0, 0, Number.MAX_VALUE, Number.MAX_VALUE));
      const range = fullRange(document);

      outputChannel.appendLine(`terraform.format: running 'terraform fmt' on '${document.fileName}'`);
      this.fmt(this._configuration['path'], document.getText())
        .then((formattedText) => {
          textEditor.edit((editor) => {
            editor.replace(range, formattedText);
          });
        }).then((applied) => {
          this._ignoreNextSave.add(document);

          return document.save();
        }).then(() => {
          outputChannel.appendLine("terraform.format: Successful.");
          this._ignoreNextSave.delete(document);
        }).catch((e) => {
          outputChannel.appendLine(`terraform.format: Failed: '${e}'`);
          vscode.window.showWarningMessage(e);
        });
    }
  }

  private isFormatOnSaveEnabled(document: vscode.TextDocument): boolean {
    if (document.fileName.endsWith('.tfvars') && this._configuration['formatVarsOnSave'] !== null) {
      return !!this._configuration['formatVarsOnSave'];
    }

    return !!this._configuration['formatOnSave'];
  }

  private fmt(execPath: String, text: string): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      const commandLine = `${execPath} fmt -`;

      const child = exec(commandLine, {
        encoding: 'utf8',
        maxBuffer: 1024 * 1024,
      }, (error, stdout, stderr) => {
        if (error) {
          let cleanedOutput = stripAnsi(stderr);
          reject(cleanedOutput.replace(/In <standard input>:/, ''));
        } else {
          resolve(stdout);
        }
      });

      child.stdin.write(text);
      child.stdin.end();
    });
  }
}