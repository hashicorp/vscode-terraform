import * as vscode from 'vscode';
import * as path from 'path';

export let doc: vscode.TextDocument;
export let editor: vscode.TextEditor;
export let documentEol: string;
export let platformEol: string;

export async function activate(docUri: vscode.Uri): Promise<void> {
	// The extensionId is `publisher.name` from package.json
	const ext = vscode.extensions.getExtension('hashicorp.terraform');
	await ext.activate();
	// allow server to initialize
	await sleep(5000);
	try {
		doc = await vscode.workspace.openTextDocument(docUri);
		editor = await vscode.window.showTextDocument(doc);
	} catch (e) {
		console.error(e);
		throw e;
	}
}

export async function sleep(ms: number): Promise<void> {
	return new Promise(resolve => setTimeout(resolve, ms));
}

export const getDocPath = (p: string): string => {
	return path.resolve(__dirname, '../../testFixture', p);
};
export const getDocUri = (p: string): vscode.Uri => {
	return vscode.Uri.file(getDocPath(p));
};

export async function setTestContent(content: string): Promise<boolean> {
	const all = new vscode.Range(
		doc.positionAt(0),
		doc.positionAt(doc.getText().length)
	);
	return editor.edit(eb => eb.replace(all, content));
}
