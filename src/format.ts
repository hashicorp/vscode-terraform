import * as vscode from 'vscode';
import { isTerraformDocument } from './helpers';
import { Logger } from './logger';
import { runTerraform } from './runner';

export class FormattingEditProvider implements vscode.DocumentFormattingEditProvider {
  private _ignoreNextSave = new WeakSet<vscode.TextDocument>();
  private logger = new Logger("formatting-provider");

  async onSave(document: vscode.TextDocument) {
    try {
      if (!isTerraformDocument(document) || this._ignoreNextSave.has(document)) {
        return;
      }

      if (!this.isFormatEnabled(document, true) || vscode.window.activeTextEditor.document !== document) {
        return;
      }

      const fullRange = doc => doc.validateRange(new vscode.Range(0, 0, Number.MAX_VALUE, Number.MAX_VALUE));
      const range = fullRange(document);

      this.logger.info(`[on-save]: running 'terraform fmt' on '${document.fileName}'`);
      let formattedText = await runTerraform(process.cwd(), ["fmt", "-"], {
        input: document.getText(),
      });

      const applied = await vscode.window.activeTextEditor.edit((editor) => {
        editor.replace(range, formattedText);
      });

      if (!applied)
        this.logger.warn("[on-save]: changes not applied");

      this._ignoreNextSave.add(document);
      await document.save();

      this.logger.info("[on-save]: successful.");
      this._ignoreNextSave.delete(document);
    } catch (error) {
      this.logger.exception("[on-save]: formatting failed.", error);
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


  async provideDocumentFormattingEdits(
    document: vscode.TextDocument,
    options: vscode.FormattingOptions,
    token: vscode.CancellationToken): Promise<vscode.TextEdit[]> {
    try {
      if (!this.isFormatEnabled(document, false)) {
        return [];
      }

      const fullRange = doc => doc.validateRange(new vscode.Range(0, 0, Number.MAX_VALUE, Number.MAX_VALUE));
      const range = fullRange(document);

      this.logger.info(`[provider]: running 'terraform fmt' on '${document.fileName}'`);
      let formattedText = await runTerraform(process.cwd(), ["fmt", "-"], {
        input: document.getText(),
      });

      this.logger.info("[provider]: successful.");
      return [new vscode.TextEdit(range, formattedText)];
    } catch (error) {
      this.logger.exception("[provider]: formatting failed.", error);
    }
  }
}