import * as vscode from 'vscode';
import {
	LanguageClient,
	LanguageClientOptions,
	ServerOptions,
	Executable
} from 'vscode-languageclient';

import { LanguageServerInstaller } from './languageServerInstaller';
import { runCommand } from './terraformCommand';

let client: LanguageClient;

export function activate(context: vscode.ExtensionContext) {
	const commandOutput = vscode.window.createOutputChannel("Terraform");
	const config = vscode.workspace.getConfiguration("terraform");

	// get rid of pre-2.0.0 settings
	if (config.has('languageServer.enabled')) {
		config.update('languageServer',
			{ "external": true, "args": [ "serve" ], "enabled": undefined },
			true
		)
	}
	let useLs = config.get("languageServer.external");

	// Terraform Commands

	// TODO switch to using the workspace/execute_command API
	// https://microsoft.github.io/language-server-protocol/specifications/specification-current/#workspace_executeCommand
	const rootPath = vscode.workspace.workspaceFolders[0].uri.path;
	context.subscriptions.push(
		vscode.commands.registerCommand('terraform.init', () => {
			runCommand(rootPath, commandOutput, 'init');
		}),
		vscode.commands.registerCommand('terraform.plan', () => {
			runCommand(rootPath, commandOutput, 'plan');
		}),
		vscode.commands.registerCommand('terraform.validate', () => {
			runCommand(rootPath, commandOutput, 'validate');
		})
	);

	// Language Server

	context.subscriptions.push(
		vscode.commands.registerCommand('terraform.installLanguageServer', () => {
			installThenStart(context, config);
		}),
		vscode.commands.registerCommand('terraform.toggleLanguageServer', () => {
			stopLsClient();
			if (useLs) {
				useLs = false;
			} else {
				useLs = true;
				installThenStart(context, config);
			}
			config.update("languageServer.external", useLs, vscode.ConfigurationTarget.Global);
		})
	);

	context.subscriptions.push(
		vscode.workspace.onDidChangeConfiguration(
			(event: vscode.ConfigurationChangeEvent) => {
				if (!event.affectsConfiguration('terraform.languageServer')) {
					return;
				}
				const reloadMsg = 'Reload VSCode window to apply language server changes';
				vscode.window.showInformationMessage(reloadMsg, 'Reload').then((selected) => {
					if (selected === 'Reload') {
						vscode.commands.executeCommand('workbench.action.reloadWindow');
					}
				});
			}
		)
	);
	
	if (useLs) {
		return installThenStart(context, config);
	}
}

export function deactivate(): Thenable<void> | undefined {
	if (!client) {
		return undefined;
	}
	return client.stop();
}

async function installThenStart(context: vscode.ExtensionContext, config: vscode.WorkspaceConfiguration) {
	const command: string = config.get("languageServer.pathToBinary");
	if (command) { // Skip install/upgrade if user has set custom binary path
		startLsClient(command, config);
	} else {
		const installer = new LanguageServerInstaller;
		const installDir = `${context.extensionPath}/lsp`
		installer.install(installDir).then(() => {
			config.update("languageServer.external", true, vscode.ConfigurationTarget.Global);
			startLsClient(`${installDir}/terraform-ls`, config);
		}).catch((err) => {
			config.update("languageServer.external", false, vscode.ConfigurationTarget.Global);
			console.log(err);
		});
	}
}

async function startLsClient(cmd: string, config: vscode.WorkspaceConfiguration) {
	let serverOptions: ServerOptions;
	const setup = vscode.window.createOutputChannel("Language Server");
	setup.appendLine("Launching language server...")

	const executable: Executable = {
		command: cmd,
		args: config.get("languageServer.args"),
		options: {}
	}
	serverOptions = {
		run: executable,
		debug: executable
	};

	const clientOptions: LanguageClientOptions = {
		documentSelector: [{ scheme: 'file', language: 'terraform' }],
		synchronize: {
			fileEvents: vscode.workspace.createFileSystemWatcher('**/*.tf')
		},
		outputChannel: setup,
		revealOutputChannelOn: 3 // error
	};

	client = new LanguageClient(
		'languageServer',
		'Language Server',
		serverOptions,
		clientOptions
	);

	return client.start();
}

function stopLsClient() {
	if (!client) {
		return;
	}
	return client.stop();
}
