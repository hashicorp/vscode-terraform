import * as vscode from 'vscode';
import ShortUniqueId from 'short-unique-id';
import {
	Executable,
	LanguageClient,
	LanguageClientOptions,
	ServerOptions,
	State,
	DocumentSelector
} from 'vscode-languageclient/node';
import {
	config,
	getFolderName,
	getWorkspaceFolder,
	normalizeFolderName,
	sortedWorkspaceFolders
} from './vscodeUtils';
import * as path from 'path';
import TelemetryReporter from 'vscode-extension-telemetry';

export interface TerraformLanguageClient {
	commandPrefix: string,
	client: LanguageClient
}

let clients: Map<string, TerraformLanguageClient> = new Map();

/**
 * ClientHandler maintains lifecycles of language clients
 * based on the server's capabilities (whether multi-folder
 * workspaces are supported).
 */
export class ClientHandler {
	private shortUid: ShortUniqueId;
	private pathToBinary: string;
	private supportsMultiFolders: boolean = true;

	constructor(private context: vscode.ExtensionContext, private reporter: TelemetryReporter ) {
		this.shortUid = new ShortUniqueId();
		this.pathToBinary = config('terraform').get('languageServer.pathToBinary');
		if (this.pathToBinary) {
			this.reporter.sendTelemetryEvent('usePathToBinary');
		} else {
			let installPath = path.join(context.extensionPath, 'lsp');
			this.pathToBinary = path.join(installPath, 'terraform-ls');
		}
	};

	public StartClients(folders?: string[]): vscode.Disposable[] {
		let disposables: vscode.Disposable[] = [];

		if (this.supportsMultiFolders) {
			if (this.GetClient()?.client.needsStart()) {
				console.log(`No need to start another client for ${folders}`)
				return disposables;
			}

			console.log('Starting client');

			let tfClient = this.newTerraformClient();
			tfClient.client.onReady().then(async () => {
				this.reporter.sendTelemetryEvent('startClient');
				const multiFoldersSupported = tfClient.client.initializeResult.capabilities.workspace?.workspaceFolders?.supported;
				console.log(`Multi-folder support: ${multiFoldersSupported}`);

				if (!multiFoldersSupported) {
					// restart is needed to launch folder-focused instances
					console.log('Restarting clients as folder-focused');
					await this.StopClients(folders);
					this.supportsMultiFolders = false;
					this.StartClients(folders);
				}
			});

			disposables.push(tfClient.client.start());
			clients.set("", tfClient);

			return disposables;
		}

		if (folders && folders.length > 0) {
			for (const folder of folders) {
				if (!clients.has(folder)) {
					console.log(`Starting client for ${folder}`);
					let folderClient = this.newTerraformClient(folder);
					folderClient.client.onReady().then(() => {
						this.reporter.sendTelemetryEvent('startClient');
					});

					disposables.push(folderClient.client.start());
					clients.set(folder, folderClient);
				} else {
					console.log(`Client for folder: ${folder} already started`);
				}
			}
		}
		return disposables;
	};

	private newTerraformClient(location?: string): TerraformLanguageClient {
		const cmd = this.pathToBinary;
		const binaryName = cmd.split('/').pop();

		const serverArgs: string[] = config('terraform').get('languageServer.args');
		const experimentalFeatures = config('terraform-ls').get('experimentalFeatures');

		let channelName = `${binaryName}`;
		let id = `languageServer`
		let name = `Language Server`
		let wsFolder: vscode.WorkspaceFolder;
		let rootModulePaths: string[];
		let excludeModulePaths: string[];
		let documentSelector: DocumentSelector;
		let outputChannel: vscode.OutputChannel;
		if (location) {
			channelName = `${binaryName}: ${location}`;
			id = `languageServer/${location}`
			name = `Language Server: ${location}`
			wsFolder = getWorkspaceFolder(location);
			documentSelector = [
				{ scheme: 'file', language: 'terraform', pattern: `${wsFolder.uri.fsPath}/**/*` },
				{ scheme: 'file', language: 'terraform-vars', pattern: `${wsFolder.uri.fsPath}/**/*` }
			]
			rootModulePaths = config('terraform-ls', wsFolder).get('rootModules');
			excludeModulePaths = config('terraform-ls', wsFolder).get('excludeRootModules');
			outputChannel = vscode.window.createOutputChannel(channelName);
			outputChannel.appendLine(`Launching language server: ${cmd} ${serverArgs.join(' ')} for folder: ${location}`);
		} else {
			documentSelector = [
				{ scheme: 'file', language: 'terraform' },
				{ scheme: 'file', language: 'terraform-vars' }
			]
			rootModulePaths = config('terraform-ls').get('rootModules');
			excludeModulePaths = config('terraform-ls').get('excludeRootModules');
			outputChannel = vscode.window.createOutputChannel(channelName);
			outputChannel.appendLine(`Launching language server: ${cmd} ${serverArgs.join(' ')}`);
		}

		if (rootModulePaths.length > 0 && excludeModulePaths.length > 0) {
			throw new Error('Only one of rootModules and excludeRootModules can be set at the same time, please remove the conflicting config and reload');
		}

		const commandPrefix = this.shortUid.seq();
		let initializationOptions = { commandPrefix, experimentalFeatures };
		if (rootModulePaths.length > 0) {
			initializationOptions = Object.assign(initializationOptions, { rootModulePaths });
		}
		if (excludeModulePaths.length > 0) {
			initializationOptions = Object.assign(initializationOptions, { excludeModulePaths });
		}

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
			documentSelector: documentSelector,
			workspaceFolder: wsFolder,
			initializationOptions: initializationOptions,
			initializationFailedHandler: (error) => {
				this.reporter.sendTelemetryException(error);
				return false;
			},
			outputChannel: outputChannel,
			revealOutputChannelOn: 4 // hide always
		};

		let client = new LanguageClient(
			id,
			name,
			serverOptions,
			clientOptions
		);

		client.onDidChangeState((event) => {
			if (event.newState === State.Stopped) {
				clients.delete(location);
				this.reporter.sendTelemetryEvent('stopClient');
			}
		});

		return {commandPrefix, client}
	};

	public async StopClients(folders?: string[]): Promise<void[]> {
		let promises: Promise<void>[] = [];

		if (this.supportsMultiFolders) {
			promises.push(this.stopClient(""));
			return Promise.all(promises);
		}

		if (!folders) {
			folders = [];
			for (const key of clients.keys()) {
				folders.push(key);
			}
		}

		for (const folder of folders) {
			promises.push(this.stopClient(folder));
		}
		return Promise.all(promises);
	};

	private async stopClient(folder: string): Promise<void> {
		if (!clients.has(folder)) {
			console.log(`Attempted to stop a client for folder: ${folder} but no client exists`);
			return;
		}
		
		return clients.get(folder).client.stop().then(() => {
			if (folder === "") {
				console.log('Client stopped');
				return
			}
			console.log(`Client stopped for ${folder}`);
		}).then(() => {
			let ok = clients.delete(folder);
			if (ok) {
				if (folder === "") {
					console.log('Client deleted');
					return
				}
				console.log(`Client deleted for ${folder}`);
			}
		});
	}

	public GetClient(document?: vscode.Uri): TerraformLanguageClient {
		if (this.supportsMultiFolders) {
			return clients.get("");
		}

		return clients.get(this.clientName(document.toString()));
	};

	private clientName(folderName: string, workspaceFolders: readonly string[] = sortedWorkspaceFolders()): string {
		folderName = normalizeFolderName(folderName);
		const outerFolder = workspaceFolders.find(element => folderName.startsWith(element));
		// If this folder isn't nested, the found item will be itself
		if (outerFolder && (outerFolder !== folderName)) {
			folderName = getFolderName(getWorkspaceFolder(outerFolder));
		}
		return folderName;
	};
}
