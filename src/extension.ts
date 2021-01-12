import * as vscode from 'vscode';
import {
	LanguageClientOptions,
	ExecuteCommandParams,
	ExecuteCommandRequest
} from 'vscode-languageclient';
import {
	LanguageClient,
	ServerOptions,
	Executable,
} from 'vscode-languageclient/node';
import ShortUniqueId from 'short-unique-id';

import { LanguageServerInstaller } from './languageServerInstaller';
import {
	config,
	getFolderName,
	getWorkspaceFolder,
	normalizeFolderName,
	prunedFolderNames,
	sortedWorkspaceFolders
} from './vscodeUtils';
import { sleep } from './utils';

interface terraformLanguageClient {
	commandPrefix: string,
	client: LanguageClient
}

const shortUid = new ShortUniqueId();
const clients: Map<string, terraformLanguageClient> = new Map();
let extensionPath: string;
const terraformStatus = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 0);

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
		vscode.commands.registerCommand('terraform.init', async () => {
			const selected = await vscode.window.showOpenDialog({
				canSelectFiles: false,
				canSelectFolders: true,
				canSelectMany: false,
				defaultUri: vscode.workspace.workspaceFolders[0].uri,
				openLabel: "Initialize"
			});
			if (selected) {
				const moduleUri = selected[0];
				const client = getDocumentClient(moduleUri);
				const requestParams: ExecuteCommandParams = { command: `${client.commandPrefix}.terraform-ls.terraform.init`, arguments: [`uri=${moduleUri}`] };
				await execWorkspaceCommand(client.client, requestParams);
			}
		}),
		vscode.commands.registerCommand('terraform.initCurrent', async () => {
			await terraformCommand('init');
		}),
		vscode.commands.registerCommand('terraform.validate', async () => {
			await terraformCommand('validate');
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
		),
		vscode.window.onDidChangeActiveTextEditor(
			async (event: vscode.TextEditor | undefined) => {
				if (event && vscode.workspace.workspaceFolders[0]) { // make sure there's an open document in a folder
					const documentUri = event.document.uri;
					const client = getDocumentClient(documentUri);
					if (client) {
						try {
							const response = await rootModules(client, documentUri.toString());
							if (response.needsInit === false) {
								terraformStatus.text = `$(refresh) ${response.rootModules[0].name}`;
								terraformStatus.color = new vscode.ThemeColor('statusBar.foreground');
								terraformStatus.tooltip = `Click to run terraform init`;
								terraformStatus.command = "terraform.initCurrent";
								terraformStatus.show();
							} else {
								terraformStatus.hide();
							}
						} catch (err) {
							vscode.window.showErrorMessage(err);
							terraformStatus.hide();
						}
					}
				}
			}
		)
	);

	if (enabled()) {
		await vscode.commands.executeCommand('terraform.enableLanguageServer');
	}

	// export public API
	return { getDocumentClient, pathToBinary, rootModules };
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
			const commandPrefix = shortUid.seq();
			const client = newClient(command, folder, commandPrefix);
			disposables.push(client.start());
			clients.set(folder, { commandPrefix, client });
		} else {
			console.log(`Client for folder: ${folder} already started`);
		}
	}
	return disposables;
}

function newClient(cmd: string, location: string, commandPrefix: string) {
	const binaryName = cmd.split('/').pop();
	const channelName = `${binaryName}: ${location}`;
	const f: vscode.WorkspaceFolder = getWorkspaceFolder(location);
	const serverArgs: string[] = config('terraform').get('languageServer.args');
	const rootModulePaths: string[] = config('terraform-ls', f).get('rootModules');
	const excludeModulePaths: string[] = config('terraform-ls', f).get('excludeRootModules');
	const experimentalFeatures = config('terraform-ls').get('experimentalFeatures');

	if (rootModulePaths.length > 0 && excludeModulePaths.length > 0) {
		throw new Error('Only one of rootModules and excludeRootModules can be set at the same time, please remove the conflicting config and reload');
	}

	let initializationOptions = { commandPrefix, experimentalFeatures };
	if (rootModulePaths.length > 0) {
		initializationOptions = Object.assign(initializationOptions, { rootModulePaths });
	}
	if (excludeModulePaths.length > 0) {
		initializationOptions = Object.assign(initializationOptions, { excludeModulePaths });
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
			promises.push(clients.get(folder).client.stop());
			clients.delete(folder);
		} else {
			console.log(`Attempted to stop a client for folder: ${folder} but no client exists`);
		}
	}
	return Promise.all(promises);
}

let _pathToBinaryPromise: Promise<string>;
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

function clientName(folderName: string, workspaceFolders: readonly string[] = sortedWorkspaceFolders()): string {
	folderName = normalizeFolderName(folderName);
	const outerFolder = workspaceFolders.find(element => folderName.startsWith(element));
	// If this folder isn't nested, the found item will be itself
	if (outerFolder && (outerFolder !== folderName)) {
		folderName = getFolderName(getWorkspaceFolder(outerFolder));
	}
	return folderName;
}

function getDocumentClient(document: vscode.Uri): terraformLanguageClient {
	return clients.get(clientName(document.toString()));
}

function execWorkspaceCommand(client: LanguageClient, params: ExecuteCommandParams): Promise<any> {
	return client.sendRequest(ExecuteCommandRequest.type, params);
}

interface rootModule {
	uri: string,
	name: string
}

interface rootModuleResponse {
	rootModules: rootModule[],
	needsInit: boolean
}

async function rootModulesCommand(languageClient: terraformLanguageClient, documentUri: string): Promise<any> {
	const requestParams: ExecuteCommandParams = { command: `${languageClient.commandPrefix}.terraform-ls.rootmodules`, arguments: [`uri=${documentUri}`] };
	return execWorkspaceCommand(languageClient.client, requestParams);
}

async function rootModules(languageClient: terraformLanguageClient, documentUri: string): Promise<rootModuleResponse> {
	let doneLoading = false;
	let rootModules: rootModule[];
	for (let attempt = 0; attempt < 2 && !doneLoading; attempt++) {
		const response = await rootModulesCommand(languageClient, documentUri);
		doneLoading = response.doneLoading;
		rootModules = response.rootModules;
		if (!doneLoading) {
			await sleep(100);
		}
	}
	if (!doneLoading) {
		throw new Error(`Unable to load root modules for ${documentUri}`);
	}
	return { rootModules: rootModules, needsInit: rootModules.length === 0 };
}

async function terraformCommand(command: string): Promise<any> {
	if (vscode.window.activeTextEditor) {
		const documentUri = vscode.window.activeTextEditor.document.uri;
		const languageClient = getDocumentClient(documentUri);
		const modules = await rootModules(languageClient, documentUri.toString());

		let selectedModule: string;
		if (modules.rootModules.length > 1) {
			const selected = await vscode.window.showQuickPick(modules.rootModules.map(m => m.uri), { canPickMany: false });
			selectedModule = selected[0];
		} else {
			selectedModule = modules.rootModules[0].uri;
		}
		const requestParams: ExecuteCommandParams = { command: `${languageClient.commandPrefix}.terraform-ls.terraform.${command}`, arguments: [`uri=${selectedModule}`] };
		return execWorkspaceCommand(languageClient.client, requestParams);
	} else {
		vscode.window.showWarningMessage(`Open a module then run terraform ${command} again`);
		return;
	}
}

function enabled(): boolean {
	return config('terraform').get('languageServer.external');
}
