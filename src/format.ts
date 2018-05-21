import * as vscode from 'vscode';
import { outputChannel } from './extension';
import { isTerraformDocument } from './helpers';
import { runTerraform } from './runner';

export class FormattingEditProvider implements vscode.DocumentFormattingEditProvider {
  private _ignoreNextSave = new WeakSet<vscode.TextDocument>();

  onSave(document: vscode.TextDocument) {
    if (!isTerraformDocument(document) || this._ignoreNextSave.has(document)) {
      return;
    }

    let textEditor = vscode.window.activeTextEditor;

    if (this.isFormatEnabled(document, true) && textEditor.document === document) {
      const fullRange = doc => doc.validateRange(new vscode.Range(0, 0, Number.MAX_VALUE, Number.MAX_VALUE));
      const range = fullRange(document);

      outputChannel.appendLine(`terraform.format [on-save]: running 'terraform fmt' on '${document.fileName}'`);
      return runTerraform(process.cwd(), ["fmt", "-"], {
        input: document.getText(),
      }).then((formattedText) => {
          textEditor.edit((editor) => {
            editor.replace(range, formattedText);
          });
        }).then((applied) => {
          this._ignoreNextSave.add(document);

          return document.save();
        }).then(() => {
          outputChannel.appendLine("terraform.format [on-save]: Successful.");
          this._ignoreNextSave.delete(document);
        }).catch((e) => {
          outputChannel.appendLine(`terraform.format [on-save]: Failed: '${e}'`);
          vscode.window.showWarningMessage(e);
        });
    }
  }

  private isFormatEnabled(document: vscode.TextDocument, onSave: boolean): boolean {
    let config = vscode.workspace.getConfiguration('terraform.format');
    if (config.get<boolean>('enable') !== true) {
      return false;
    }

    if (!onSave) {
      return true;
    }

    if (config.get<boolean>('formatOnSave') !== true) {
      return false;
    }

    return config.get<Array<string>>('ignoreExtensionsOnSave').map((ext) => {
      return document.fileName.endsWith(ext);
    }).indexOf(true) === -1;
  }


  provideDocumentFormattingEdits(document: vscode.TextDocument, options: vscode.FormattingOptions, token: vscode.CancellationToken): vscode.ProviderResult<vscode.TextEdit[]> {
    if (!this.isFormatEnabled(document, false)) {
      return [];
    }

    const fullRange = doc => doc.validateRange(new vscode.Range(0, 0, Number.MAX_VALUE, Number.MAX_VALUE));
    const range = fullRange(document);

    outputChannel.appendLine(`terraform.format [provider]: running 'terraform fmt' on '${document.fileName}'`);
    return runTerraform(process.cwd(), ["fmt", "-"], {
      input: document.getText(),
    }).then((formattedText) => {
        outputChannel.appendLine("terraform.format [provider]: Successful.");
        return [new vscode.TextEdit(range, formattedText)];
      }).catch((e) => {
        outputChannel.appendLine(`terraform.format [provider]: Failed: '${e}'`);
        vscode.window.showWarningMessage(e);
        return [];
      });
  }
}