import * as vscode from 'vscode';
import {
	LanguageClient,
	LanguageClientOptions,
	ServerOptions,
	Executable
} from 'vscode-languageclient';

import { LanguageServerInstaller } from './languageServerInstaller';
import { runCommand } from './terraformCommand';

let clients: Map<string, LanguageClient> = new Map();
let extensionPath: string;
// tracks if a enabling/disabling change was done via command, avoids prompting reload
let enableDisableByCommand = false;

export async function activate(context: vscode.ExtensionContext) {
	extensionPath = context.extensionPath;
	const commandOutput = vscode.window.createOutputChannel('Terraform');
	// get rid of pre-2.0.0 settings
	if (config('terraform').has('languageServer.enabled')) {
		try {
			let current = config('terraform').get('languageServer');
			await config('terraform').update('languageServer', Object.assign(current, {enabled: undefined}), vscode.ConfigurationTarget.Global);
		} catch (err) {
			console.error(`Error trying to erase terraform.languageServer.enabled: ${err.message}`);
		}
	}

	// Terraform Commands

	// TODO switch to using the workspace/execute_command API
	// https://microsoft.github.io/language-server-protocol/specifications/specification-current/#workspace_executeCommand
	// const rootPath = vscode.workspace.workspaceFolders[0].uri.path;
	// context.subscriptions.push(
	// 	vscode.commands.registerCommand('terraform.init', () => {
	// 		runCommand(rootPath, commandOutput, 'init');
	// 	}),
	// 	vscode.commands.registerCommand('terraform.plan', () => {
	// 		runCommand(rootPath, commandOutput, 'plan');
	// 	}),
	// 	vscode.commands.registerCommand('terraform.validate', () => {
	// 		runCommand(rootPath, commandOutput, 'validate');
	// 	})
	// );

	// Subscriptions
	context.subscriptions.push(
		vscode.commands.registerCommand('terraform.enableLanguageServer', async () => {
			enableDisableByCommand = true;
			await config('terraform').update('languageServer', { external: true }, vscode.ConfigurationTarget.Global);
			return startClients();
		}),
		vscode.commands.registerCommand('terraform.disableLanguageServer', async () => {
			enableDisableByCommand = true;
			await config('terraform').update('languageServer', { external: false }, vscode.ConfigurationTarget.Global);
			return stopClients();
		}),
		vscode.workspace.onDidChangeConfiguration(
			async (event: vscode.ConfigurationChangeEvent) => {
				if (event.affectsConfiguration('terraform-ls') || (event.affectsConfiguration('terraform') && !enableDisableByCommand)) {
					enableDisableByCommand = false;
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
					await stopClients(folderNames(event.removed));
				}
				if (event.added.length > 0) {
					await startClients(folderNames(event.added));
				}
			}
		)
	);

	const useLs: boolean = config('terraform').get('languageServer.external');
	console.log(useLs);
	// if (useLs) {
	// 	return vscode.commands.executeCommand('terraform.enableLanguageServer');
	// }
}

export function deactivate() {
	return stopClients();
}

async function startClients(folders = folderNames()) {
	console.log('Starting:', folders);
	const command = await pathToBinary();
	let disposables: vscode.Disposable[] = [];
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

function newClient(cmd: string, folder: string) {
	const binaryName = cmd.split('/').pop();
	const channelName = `${binaryName}/${folder}`;
	const f = pathToWorkspaceFolder(folder);
	const serverArgs: string[] = config('terraform').get('languageServer.args');
	let initializationOptions = { 
		rootModulePaths: config('terraform-ls', f).get('rootModules'),
		excludeModulePaths: config('terraform-ls', f).get('excludeRootModules')
	};

	const setup = vscode.window.createOutputChannel(channelName);
	setup.appendLine(`Launching language server: ${cmd} ${serverArgs.join(' ')} for folder: ${folder}`);

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
		`languageServer/${folder}`,
		`Language Server: ${folder}`,
		serverOptions,
		clientOptions
	);
}

async function stopClients(folders = folderNames()) {
	console.log('Stopping:', folders);
	let promises: Thenable<void>[] = [];
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
			try {
				await (new LanguageServerInstaller).install(installDir);
			} catch (err) {
				vscode.window.showErrorMessage(err);
				throw err;
			}
			command = `${installDir}/terraform-ls`;
		}
		_pathToBinaryPromise = Promise.resolve(command);
	}
	return _pathToBinaryPromise;
}

function config(section: string, scope?: vscode.ConfigurationScope) {
	return vscode.workspace.getConfiguration(section, scope);
}

function pathToWorkspaceFolder(folder: string) {
	return vscode.workspace.getWorkspaceFolder(vscode.Uri.parse(folder));
}

function folderNames(folders: readonly vscode.WorkspaceFolder[] = vscode.workspace.workspaceFolders): string[] {
	if (!folders) {
		return [];
	}
	return folders.map(folder => {
		let result = folder.uri.toString();
		if (result.charAt(result.length - 1) !== '/') {
			result = result + '/';
		}
		return result;
	});
}
