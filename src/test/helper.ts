import * as vscode from 'vscode';
import * as path from 'path';
import { sleep } from '../utils';

export let doc: vscode.TextDocument;
export let editor: vscode.TextEditor;
export let documentEol: string;
export let platformEol: string;

export async function open(docUri: vscode.Uri): Promise<void> {
	try {
		await activated();
		doc = await vscode.workspace.openTextDocument(docUri);
		editor = await vscode.window.showTextDocument(doc);
	} catch (e) {
		console.error(e);
		throw e;
	}
}

let _activatedPromise: Promise<void>
async function activated() {
	if (!_activatedPromise) {
		try {
			// The extensionId is `publisher.name` from package.json
			const ext = vscode.extensions.getExtension('hashicorp.terraform');
			if (!ext.isActive) {
				console.log('Activating hashicorp.terraform extension');
				await ext.activate();
			} else {
				console.log('hashicorp.terraform is already active');
			}
			// make sure language server download is complete
			await ext.exports.pathToBinary();
			// TODO: implement proper synchronization/status check in LS
			// give server(s) some time to startup
			_activatedPromise = sleep(3000);
		} catch (err) {
			_activatedPromise = Promise.reject(err);
		}
	}
	return _activatedPromise;
}

export const testFolderPath =path.resolve(__dirname, '../../testFixture');

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
