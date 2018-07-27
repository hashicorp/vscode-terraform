import * as vscode from 'vscode';
import { getConfiguration } from './configuration';
import { Logger } from './logger';
import { Runner } from './runner';

export class FormattingEditProvider implements vscode.DocumentFormattingEditProvider {
  private logger = new Logger("formatting-provider");

  constructor(private runner: Runner) { }

  private isFormatEnabled(document: vscode.TextDocument): boolean {
    const ignoreExtensionsOnSave = getConfiguration().format.ignoreExtensionsOnSave || [];
    return ignoreExtensionsOnSave.map((ext) => {
      return document.fileName.endsWith(ext);
    }).indexOf(true) === -1;
  }

  async provideDocumentFormattingEdits(
    document: vscode.TextDocument,
    options: vscode.FormattingOptions,
    token: vscode.CancellationToken): Promise<vscode.TextEdit[]> {
    try {
      if (!this.isFormatEnabled(document)) {
        return [];
      }

      const fullRange = doc => doc.validateRange(new vscode.Range(0, 0, Number.MAX_VALUE, Number.MAX_VALUE));
      const range = fullRange(document);

      this.logger.info(`running 'terraform fmt' on '${document.fileName}'`);
      let formattedText = await this.runner.run({
        input: document.getText(),
      }, "fmt", "-");

      return [new vscode.TextEdit(range, formattedText)];
    } catch (error) {
      this.logger.exception("formatting failed.", error);
    }
  }
}