import * as vscode from 'vscode';

export function isTerraformDocument(document: vscode.TextDocument): boolean {
  if (document.languageId !== "terraform") {
    return false;
  }

  if (document.isUntitled) {
    return true;
  }

  return (document.fileName.endsWith('.tf') || document.fileName.endsWith('.tfvars'));
}