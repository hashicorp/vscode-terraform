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
	State as ClientState
} from 'vscode-languageclient/node';
import { Utils } from 'vscode-uri'
import * as path from 'path';
import ShortUniqueId from 'short-unique-id';
import TelemetryReporter from 'vscode-extension-telemetry';

import { LanguageServerInstaller } from './languageServerInstaller';
import {
	config,
	getFolderName,
	getWorkspaceFolder,
	normalizeFolderName,
	prunedFolderNames,
	sortedWorkspaceFolders
} from './vscodeUtils';
import {
	SingleInstanceTimeout,
} from './utils';

interface terraformLanguageClient {
	commandPrefix: string,
	client: LanguageClient
}

const clients: Map<string, terraformLanguageClient> = new Map();
const shortUid = new ShortUniqueId();
const terraformStatus = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 0);

// Telemetry config
const extensionId = 'hashicorp.terraform';
const appInsightsKey = '885372d2-6f3c-499f-9d25-b8b219983a52';
let reporter: TelemetryReporter;

let installPath: string;
const languageServerUpdater = new SingleInstanceTimeout();

export async function activate(context: vscode.ExtensionContext): Promise<any> {
	const extensionVersion = vscode.extensions.getExtension(extensionId).packageJSON.version;
	reporter = new TelemetryReporter(extensionId, extensionVersion, appInsightsKey);
	context.subscriptions.push(reporter);
	installPath = path.join(context.extensionPath, 'lsp');

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
			return updateLanguageServer();
		}),
		vscode.commands.registerCommand('terraform.disableLanguageServer', async () => {
			if (enabled()) {
				const current = config('terraform').get('languageServer');
				await config('terraform').update('languageServer', Object.assign(current, { external: false }), vscode.ConfigurationTarget.Global);
			}
			languageServerUpdater.clear();
			return stopClients();
		}),
		vscode.commands.registerCommand('terraform.apply', async () => {
			await terraformCommand('apply', false);
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
		vscode.commands.registerCommand('terraform.plan', async () => {
			await terraformCommand('plan', false);
		}),
		vscode.commands.registerCommand('terraform.validate', async () => {
			await terraformCommand('validate');
		}),
		vscode.commands.registerCommand('terraform.destroy', async () => {
			const result = await vscode.window.showWarningMessage('Do you really want to destroy all resources?', { modal: true}, 'Yes');

			if (result) {
				await terraformCommand('destroy', false);
			}
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
				// Make sure there's an open document in a folder
				// Also check whether they're running a different language server
				// TODO: Check initializationOptions for command presence instead of pathToBinary
				if (event && vscode.workspace.workspaceFolders[0] && !config('terraform').get('languageServer.pathToBinary')) {
					const documentUri = event.document.uri;
					const client = getDocumentClient(documentUri);
					const moduleUri = Utils.dirname(documentUri);

					if (client) {
						try {
							const response = await moduleCallers(client, moduleUri.toString());
							if (response.moduleCallers.length === 0) {
								const dirName = Utils.basename(moduleUri);
								terraformStatus.text = `$(refresh) ${dirName}`;
								terraformStatus.color = new vscode.ThemeColor('statusBar.foreground');
								terraformStatus.tooltip = `Click to run terraform init`;
								terraformStatus.command = "terraform.initCurrent";
								terraformStatus.show();
							} else {
								terraformStatus.hide();
							}
						} catch (err) {
							vscode.window.showErrorMessage(err);
							reporter.sendTelemetryException(err);
							terraformStatus.hide();
						}
					}
				}
			}
		)
	);

	if (enabled()) {
		try {
			await vscode.commands.executeCommand('terraform.enableLanguageServer');
		} catch (error) {
			reporter.sendTelemetryException(error);
		}
	}

	// export public API
	return { getDocumentClient, moduleCallers };
}

export function deactivate(): Promise<void[]> {
	return stopClients();
}

async function updateLanguageServer() {
	const delay = 1000 * 60 * 60 * 24;
	languageServerUpdater.timeout(updateLanguageServer, delay); // check for new updates every 24hrs

	// skip install if a language server binary path is set
	if (!config('terraform').get('languageServer.pathToBinary')) {
		const installer = new LanguageServerInstaller(installPath, reporter);
		const install = await installer.needsInstall();
		if (install) {
			await stopClients();
			try {
				await installer.install();
			} catch (err) {
				console.log(err); // for test failure reporting
				reporter.sendTelemetryException(err);
				throw err;
			} finally {
				await installer.cleanupZips();
			}
		}
	}
	return startClients(); // on repeat runs with no install, this will be a no-op
}

async function startClients(folders = prunedFolderNames()) {
	console.log('Starting:', folders);
	const command = await pathToBinary();
	const disposables: vscode.Disposable[] = [];

	const firstClient = configureClient(command, folders[0])
	firstClient.client.onReady().then(() => {
		reporter.sendTelemetryEvent('startClient');
		const multiFoldersSupported = firstClient.client.initializeResult.capabilities.workspace?.workspaceFolders?.supported;

		console.log("Multi-folder support: ", multiFoldersSupported);
		const remainingFolders = folders.slice(1);
		for (const folder of remainingFolders) {
			if (multiFoldersSupported) {
				// Reuse the same client if server supports multiple workspace folders
				clients.set(folder, firstClient);
				continue
			}

			if (!clients.has(folder)) {
				const c = configureClient(command, folder);
				disposables.push(c.client.start());
				clients.set(folder, c);
			} else {
				console.log(`Client for folder: ${folder} already started`);
			}
		}
	});

	disposables.push(firstClient.client.start());
	clients.set(folders[0], firstClient);
	
	return disposables;
}

function configureClient(binPath:string, folder: string) {
	const commandPrefix = shortUid.seq();
	const client = newClient(binPath, folder, commandPrefix);

	client.onDidChangeState((event) => {
		if (event.newState === ClientState.Stopped) {
			clients.delete(folder);
			reporter.sendTelemetryEvent('stopClient');
		}
	});
	return { commandPrefix, client }
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
		documentSelector: [{ scheme: 'file', language: 'terraform', pattern: `${f.uri.fsPath}/**/*` },
		{ scheme: 'file', language: 'terraform-vars', pattern: `${f.uri.fsPath}/**/*` }],
		workspaceFolder: f,
		initializationOptions: initializationOptions,
		initializationFailedHandler: (error) => {
			reporter.sendTelemetryException(error);
			return false;
		},
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
		if (command) { // Skip install/upgrade if user has set custom binary path
			reporter.sendTelemetryEvent('usePathToBinary');
		} else {
			command = path.join(installPath, 'terraform-ls');
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
	reporter.sendTelemetryEvent('execWorkspaceCommand', { command: params.command });
	return client.sendRequest(ExecuteCommandRequest.type, params);
}

interface moduleCaller {
	uri: string
}

interface moduleCallersResponse {
	version: number,
	moduleCallers: moduleCaller[]
}

async function modulesCallersCommand(languageClient: terraformLanguageClient, moduleUri: string): Promise<any> {
	const requestParams: ExecuteCommandParams = { command: `${languageClient.commandPrefix}.terraform-ls.module.callers`, arguments: [`uri=${moduleUri}`] };
	return execWorkspaceCommand(languageClient.client, requestParams);
}

async function moduleCallers(languageClient: terraformLanguageClient, moduleUri: string): Promise<moduleCallersResponse> {
	const response = await modulesCallersCommand(languageClient, moduleUri);
	const moduleCallers: moduleCaller[] = response.callers;

	return { version: response.v, moduleCallers };
}

async function terraformCommand(command: string, languageServerExec = true): Promise<any> {
	if (vscode.window.activeTextEditor) {
		const documentUri = vscode.window.activeTextEditor.document.uri;
		const languageClient = getDocumentClient(documentUri);

		const moduleUri = Utils.dirname(documentUri)
		const response = await moduleCallers(languageClient, moduleUri.toString());

		let selectedModule: string;
		if (response.moduleCallers.length > 1) {
			const selected = await vscode.window.showQuickPick(response.moduleCallers.map(m => m.uri), { canPickMany: false });
			selectedModule = selected[0];
		} else if (response.moduleCallers.length == 1) {
			selectedModule = response.moduleCallers[0].uri;
		} else {
			selectedModule = moduleUri.toString();
		}

		if (languageServerExec) {
			const requestParams: ExecuteCommandParams = { command: `${languageClient.commandPrefix}.terraform-ls.terraform.${command}`, arguments: [`uri=${selectedModule}`] };
			return execWorkspaceCommand(languageClient.client, requestParams);
		} else {
			const terminalName = `Terraform ${selectedModule}`;
			const moduleURI = vscode.Uri.parse(selectedModule);
			const terraformCommand = await vscode.window.showInputBox(
				{ value: `terraform ${command}`, prompt: `Run in ${selectedModule}` }
			);
			if (terraformCommand) {
				const terminal = vscode.window.terminals.find(t => t.name == terminalName) ||
					vscode.window.createTerminal({ name: `Terraform ${selectedModule}`, cwd: moduleURI });
				terminal.sendText(terraformCommand);
				terminal.show();
			}
			return;
		}
	} else {
		vscode.window.showWarningMessage(`Open a module then run terraform ${command} again`);
		return;
	}
}

function enabled(): boolean {
	return config('terraform').get('languageServer.external');
}
