import * as vscode from 'vscode';
import {
	ExecuteCommandParams,
	ExecuteCommandRequest
} from 'vscode-languageclient';
import {
	LanguageClient
} from 'vscode-languageclient/node';
import { Utils } from 'vscode-uri'
import * as path from 'path';
import TelemetryReporter from 'vscode-extension-telemetry';

import { LanguageServerInstaller } from './languageServerInstaller';
import { ClientHandler, TerraformLanguageClient } from './clientHandler';
import {
	config,
	prunedFolderNames,
} from './vscodeUtils';
import {
	SingleInstanceTimeout,
} from './utils';

const terraformStatus = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 0);

// Telemetry config
const extensionId = 'hashicorp.terraform';
const appInsightsKey = '885372d2-6f3c-499f-9d25-b8b219983a52';
let reporter: TelemetryReporter;

let clientHandler: ClientHandler;
const languageServerUpdater = new SingleInstanceTimeout();

export async function activate(context: vscode.ExtensionContext): Promise<any> {
	const extensionVersion = vscode.extensions.getExtension(extensionId).packageJSON.version;
	reporter = new TelemetryReporter(extensionId, extensionVersion, appInsightsKey);
	context.subscriptions.push(reporter);

	clientHandler = new ClientHandler(context, reporter);

	let installPath = path.join(context.extensionPath, 'lsp');

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
			return updateLanguageServer(clientHandler, installPath);
		}),
		vscode.commands.registerCommand('terraform.disableLanguageServer', async () => {
			if (enabled()) {
				const current = config('terraform').get('languageServer');
				await config('terraform').update('languageServer', Object.assign(current, { external: false }), vscode.ConfigurationTarget.Global);
			}
			languageServerUpdater.clear();
			return clientHandler.StopClients();
		}),
		vscode.commands.registerCommand('terraform.apply', async () => {
			await terraformCommand('apply', false, clientHandler);
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
				const client = clientHandler.GetClient(moduleUri);
				const requestParams: ExecuteCommandParams = { command: `${client.commandPrefix}.terraform-ls.terraform.init`, arguments: [`uri=${moduleUri}`] };
				await execWorkspaceCommand(client.client, requestParams);
			}
		}),
		vscode.commands.registerCommand('terraform.initCurrent', async () => {
			await terraformCommand('init', true, clientHandler);
		}),
		vscode.commands.registerCommand('terraform.plan', async () => {
			await terraformCommand('plan', false, clientHandler);
		}),
		vscode.commands.registerCommand('terraform.validate', async () => {
			await terraformCommand('validate', true, clientHandler);
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
					await clientHandler.StopClients(prunedFolderNames(event.removed));
				}
				if (event.added.length > 0) {
					clientHandler.StartClients(prunedFolderNames(event.added));
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
					const client = clientHandler.GetClient(documentUri);
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
	return { clientHandler, moduleCallers };
}

export function deactivate(): Promise<void[]> {
	return clientHandler.StopClients();
}

async function updateLanguageServer(clientHandler: ClientHandler, installPath: string) {
	const delay = 1000 * 60 * 60 * 24;
	languageServerUpdater.timeout(updateLanguageServer, delay); // check for new updates every 24hrs

	// skip install if a language server binary path is set
	if (!config('terraform').get('languageServer.pathToBinary')) {
		const installer = new LanguageServerInstaller(installPath, reporter);
		const install = await installer.needsInstall();
		if (install) {
			await clientHandler.StopClients();
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
	return clientHandler.StartClients(prunedFolderNames()); // on repeat runs with no install, this will be a no-op
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

async function modulesCallersCommand(languageClient: TerraformLanguageClient, moduleUri: string): Promise<any> {
	const requestParams: ExecuteCommandParams = { command: `${languageClient.commandPrefix}.terraform-ls.module.callers`, arguments: [`uri=${moduleUri}`] };
	return execWorkspaceCommand(languageClient.client, requestParams);
}

async function moduleCallers(languageClient: TerraformLanguageClient, moduleUri: string): Promise<moduleCallersResponse> {
	const response = await modulesCallersCommand(languageClient, moduleUri);
	const moduleCallers: moduleCaller[] = response.callers;

	return { version: response.v, moduleCallers };
}

async function terraformCommand(command: string, languageServerExec = true, clientHandler: ClientHandler): Promise<any> {
	if (vscode.window.activeTextEditor) {
		const documentUri = vscode.window.activeTextEditor.document.uri;
		const languageClient = clientHandler.GetClient(documentUri);

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
