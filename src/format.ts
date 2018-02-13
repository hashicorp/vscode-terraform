import * as vscode from 'vscode';
import { execFile } from 'child_process';

import { stripAnsi } from './ansi';
import { isTerraformDocument } from './helpers';
import { outputChannel } from './extension';

export class FormattingEditProvider implements vscode.DocumentFormattingEditProvider {
  provideDocumentFormattingEdits(document: vscode.TextDocument, options: vscode.FormattingOptions, token: vscode.CancellationToken): vscode.ProviderResult<vscode.TextEdit[]> {
    if (this.formattingDisabled()) {
      return [];
    }

    const fullRange = doc => doc.validateRange(new vscode.Range(0, 0, Number.MAX_VALUE, Number.MAX_VALUE));
    const range = fullRange(document);

    outputChannel.appendLine(`terraform.format: running 'terraform fmt' on '${document.fileName}'`);
    return this.fmt(this.getPath(), document.getText())
      .then((formattedText) => {
        outputChannel.appendLine("terraform.format: Successful.");
        return [new vscode.TextEdit(range, formattedText)];
      }).catch((e) => {
        outputChannel.appendLine(`terraform.format: Failed: '${e}'`);
        vscode.window.showWarningMessage(e);
        return [];
      });
  }

  private formattingDisabled(): boolean {
    return vscode.workspace.getConfiguration('terraform.format').get<boolean>('enable') !== true;
  }

  private getPath(): string {
    return vscode.workspace.getConfiguration('terraform')['path'];
  }

  private fmt(execPath: String, text: string): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      const commandLineArgs = ["fmt", "-"];

      const child = execFile("${execPath}", commandLineArgs, {
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