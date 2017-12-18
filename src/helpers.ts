import * as vscode from 'vscode';

export function isTerraformDocument(document: vscode.TextDocument): boolean {
  return document.languageId === "terraform";
}