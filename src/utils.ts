import * as cp from 'child_process';
import * as https from 'https';
import * as vscode from 'vscode';

export function config(section: string, scope?: vscode.ConfigurationScope): vscode.WorkspaceConfiguration {
	return vscode.workspace.getConfiguration(section, scope);
}

export function exec(cmd: string): Promise<{ stdout: string, stderr: string }> {
	return new Promise((resolve, reject) => {
		cp.exec(cmd, (err, stdout, stderr) => {
			if (err) {
				return reject(err);
			}
			return resolve({ stdout, stderr });
		});
	});
}

export function getWorkspaceFolder(folderName: string): vscode.WorkspaceFolder {
	return vscode.workspace.getWorkspaceFolder(vscode.Uri.parse(folderName));
}

export function httpsRequest(url: string, options: https.RequestOptions = {}, encoding = 'utf8'): Promise<string> {
	return new Promise((resolve, reject) => {
		https.request(url, options, res => {
			if (res.statusCode === 301 || res.statusCode === 302) { // follow redirects
				return resolve(httpsRequest(res.headers.location, options, encoding));
			}
			if (res.statusCode !== 200) {
				return reject(res.statusMessage);
			}
			let body = '';
			res.setEncoding(encoding)
				.on('data', data => body += data)
				.on('end', () => resolve(body));
		})
			.on('error', reject)
			.end();
	});
}

export function prunedFolderNames(folders: readonly vscode.WorkspaceFolder[] = vscode.workspace.workspaceFolders): string[] {
	const result = [];
	// Sort workspace folders so that outer folders (shorter path) go before inner ones
	const workspaceFolders = sortedWorkspaceFolders();
	if (folders && workspaceFolders) {
		const folderNames = folders.map(f => getFolderName(f));
		for (let name of folderNames) {
			const outerFolder = workspaceFolders.find(element => name.startsWith(element));
			// If this folder isn't nested, the found item will be itself
			if (outerFolder && (outerFolder !== name)) {
				name = getFolderName(getWorkspaceFolder(outerFolder));
			}
			result.push(name);
		}
	}

	return result;
}

// Private functions

function getFolderName(folder: vscode.WorkspaceFolder): string {
	let result = folder.uri.toString();
	if (result.charAt(result.length - 1) !== '/') {
		result = result + '/';
	}
	return result;
}

function sortedWorkspaceFolders() {
	const workspaceFolders = vscode.workspace.workspaceFolders;
	if (workspaceFolders) {
		return vscode.workspace.workspaceFolders.map(f => getFolderName(f)).sort(
			(a, b) => {
				return a.length - b.length;
			});
	}
	return [];
}
