import * as vscode from 'vscode';

export function config(section: string, scope?: vscode.ConfigurationScope): vscode.WorkspaceConfiguration {
	return vscode.workspace.getConfiguration(section, scope);
}

export function getFolderName(folder: vscode.WorkspaceFolder): string {
	let result = folder.uri.toString();
	if (result.charAt(result.length - 1) !== '/') {
		result = result + '/';
	}
	return result;
}

export function getWorkspaceFolder(folderName: string): vscode.WorkspaceFolder {
	return vscode.workspace.getWorkspaceFolder(vscode.Uri.parse(folderName));
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

export function sortedWorkspaceFolders(): string[] {
	const workspaceFolders = vscode.workspace.workspaceFolders;
	if (workspaceFolders) {
		return vscode.workspace.workspaceFolders.map(f => getFolderName(f)).sort(
			(a, b) => {
				return a.length - b.length;
			});
	}
	return [];
}
