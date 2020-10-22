import * as vscode from 'vscode';
import {
	LanguageClient,
	LanguageClientOptions,
	ServerOptions,
	Executable
} from 'vscode-languageclient';

import { LanguageServerInstaller } from './languageServerInstaller';
import { config, getWorkspaceFolder, prunedFolderNames } from './utils';

const clients: Map<string, LanguageClient> = new Map();
let extensionPath: string;

export async function activate(context: vscode.ExtensionContext): Promise<any> {
	extensionPath = context.extensionPath;
	// get rid of pre-2.0.0 settings
	if (config('terraform').has('languageServer.enabled')) {
		try {
			await config('terraform').update('languageServer', { enabled: undefined, external: true }, vscode.ConfigurationTarget.Global);
		} catch (err) {
			console.error(`Error trying to erase pre-2.0.0 settings: ${err.message}`);
		}
	}

	// Subscriptions
	context.subscriptions.push(
		vscode.commands.registerCommand('terraform.enableLanguageServer', async () => {
			if (!enabled()) {
				const current = config('terraform').get('languageServer');
				await config('terraform').update('languageServer', Object.assign(current, { external: true }), vscode.ConfigurationTarget.Global);
			}
			return startClients();
		}),
		vscode.commands.registerCommand('terraform.disableLanguageServer', async () => {
			if (enabled()) {
				const current = config('terraform').get('languageServer');
				await config('terraform').update('languageServer', Object.assign(current, { external: false }), vscode.ConfigurationTarget.Global);
			}
			return stopClients();
		}),
		vscode.workspace.onDidChangeConfiguration(
			async (event: vscode.ConfigurationChangeEvent) => {
				if (event.affectsConfiguration('terraform') || event.affectsConfiguration('terraform-ls')) {
					const reloadMsg = 'Reload VSCode window to apply language server changes';
					const selected = await vscode.window.showInformationMessage(reloadMsg, 'Reload');
					if (selected === 'Reload') {
						vscode.commands.executeCommand('workbench.action.reloadWindow');
					}
				}
			}
		),
		vscode.workspace.onDidChangeWorkspaceFolders(
			async (event: vscode.WorkspaceFoldersChangeEvent) => {
				if (event.removed.length > 0) {
					await stopClients(prunedFolderNames(event.removed));
				}
				if (event.added.length > 0) {
					await startClients(prunedFolderNames(event.added));
				}
			}
		)
	);

	if (enabled()) {
		await vscode.commands.executeCommand('terraform.enableLanguageServer');
	}

	// export public API
	return { pathToBinary, clients };
}

export function deactivate(): Promise<void[]> {
	return stopClients();
}

async function startClients(folders = prunedFolderNames()) {
	console.log('Starting:', folders);
	const command = await pathToBinary();
	const disposables: vscode.Disposable[] = [];
	for (const folder of folders) {
		if (!clients.has(folder)) {
			const client = newClient(command, folder);
			disposables.push(client.start());
			clients.set(folder, client);
		} else {
			console.log(`Client for folder: ${folder} already started`);
		}
	}
	return disposables
}

function newClient(cmd: string, location: string) {
	const binaryName = cmd.split('/').pop();
	const channelName = `${binaryName}: ${location}`;
	const f: vscode.WorkspaceFolder = getWorkspaceFolder(location);
	const serverArgs: string[] = config('terraform').get('languageServer.args');
	const rootModulePaths: string[] = config('terraform-ls', f).get('rootModules');
	const excludeModulePaths: string[] = config('terraform-ls', f).get('excludeRootModules');
	if (rootModulePaths.length > 0 && excludeModulePaths.length > 0) {
		throw new Error('Only one of rootModules and excludeRootModules can be set at the same time, please remove the conflicting config and reload'); 
	}
	let initializationOptions = {};
	if (rootModulePaths.length > 0) {
		initializationOptions = { rootModulePaths };
	}
	if (excludeModulePaths.length > 0) {
		initializationOptions = { excludeModulePaths };
	}

	const setup = vscode.window.createOutputChannel(channelName);
	setup.appendLine(`Launching language server: ${cmd} ${serverArgs.join(' ')} for folder: ${location}`);

	const executable: Executable = {
		command: cmd,
		args: serverArgs,
		options: {}
	};
	const serverOptions: ServerOptions = {
		run: executable,
		debug: executable
	};
	const clientOptions: LanguageClientOptions = {
		documentSelector: [{ scheme: 'file', language: 'terraform', pattern: `${f.uri.fsPath}/**/*` }],
		workspaceFolder: f,
		initializationOptions: initializationOptions,
		outputChannel: setup,
		revealOutputChannelOn: 4 // hide always
	};

	return new LanguageClient(
		`languageServer/${location}`,
		`Language Server: ${location}`,
		serverOptions,
		clientOptions
	);
}

async function stopClients(folders = prunedFolderNames()) {
	console.log('Stopping:', folders);
	const promises: Thenable<void>[] = [];
	for (const folder of folders) {
		if (clients.has(folder)) {
			promises.push(clients.get(folder).stop());
			clients.delete(folder);
		} else {
			console.log(`Attempted to stop a client for folder: ${folder} but no client exists`);
		}
	}
	return Promise.all(promises);
}

let _pathToBinaryPromise: Promise<string>
async function pathToBinary(): Promise<string> {
	if (!_pathToBinaryPromise) {
		let command: string = config('terraform').get('languageServer.pathToBinary');
		if (!command) { // Skip install/upgrade if user has set custom binary path
			const installDir = `${extensionPath}/lsp`;
			const installer = new LanguageServerInstaller();
			try {
				await installer.install(installDir);
			} catch (err) {
				vscode.window.showErrorMessage(err);
				throw err;
			} finally {
				await installer.cleanupZips(installDir);
			}
			command = `${installDir}/terraform-ls`;
		}
		_pathToBinaryPromise = Promise.resolve(command);
	}
	return _pathToBinaryPromise;
}

function enabled(): boolean {
	return config('terraform').get('languageServer.external');
}
