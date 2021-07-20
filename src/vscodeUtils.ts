import * as vscode from 'vscode';
import * as path from 'path';

export class ServerPath {
	private folderName = 'lsp';
	private customBinPath: string;
	public customBinPathOptionName = 'languageServer.pathToBinary';

	constructor(private context: vscode.ExtensionContext ) {
		this.customBinPath = config('terraform').get(this.customBinPathOptionName);
	}

	public installPath(): string {
		return this.context.asAbsolutePath(this.folderName);
	}

	public hasCustomBinPath(): boolean {
		return !!this.customBinPath;
	}

	public binPath(): string {
		if (this.hasCustomBinPath()) {
			return this.customBinPath;
		}

		return path.resolve(this.installPath(), this.binName());
	}

	public binName(): string {
		if (this.hasCustomBinPath()) {
			return path.basename(this.customBinPath);
		}

		if (process.platform === 'win32') {
			return 'terraform-ls.exe'
		}
		return 'terraform-ls';
	}
}

export function config(section: string, scope?: vscode.ConfigurationScope): vscode.WorkspaceConfiguration {
	return vscode.workspace.getConfiguration(section, scope);
}

export function getFolderName(folder: vscode.WorkspaceFolder): string {
	return normalizeFolderName(folder.uri.toString());
}

// Make sure that folder uris always end with a slash
export function normalizeFolderName(folderName: string): string {
	if (folderName.charAt(folderName.length - 1) !== '/') {
		folderName = folderName + '/';
	}
	return folderName;
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
