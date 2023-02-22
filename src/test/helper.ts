/**
 * Copyright (c) HashiCorp, Inc.
 * SPDX-License-Identifier: MPL-2.0
 */

import * as vscode from 'vscode';
import * as path from 'path';

export let doc: vscode.TextDocument;
export let editor: vscode.TextEditor;
export let documentEol: string;
export let platformEol: string;

export async function open(docUri: vscode.Uri): Promise<void> {
  try {
    doc = await vscode.workspace.openTextDocument(docUri);
    editor = await vscode.window.showTextDocument(doc);
  } catch (e) {
    console.error(e);
    throw e;
  }
}

export function getExtensionId(): string {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const pjson = require('../../package.json');
  return `${pjson.publisher}.${pjson.name}`;
}

export const testFolderPath = path.resolve(__dirname, '..', '..', 'testFixture');

export const getDocPath = (p: string): string => {
  return path.resolve(__dirname, '../../testFixture', p);
};
export const getDocUri = (p: string): vscode.Uri => {
  return vscode.Uri.file(getDocPath(p));
};

export async function setTestContent(content: string): Promise<boolean> {
  const all = new vscode.Range(doc.positionAt(0), doc.positionAt(doc.getText().length));
  return editor.edit((eb) => eb.replace(all, content));
}
