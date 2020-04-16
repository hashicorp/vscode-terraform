import * as vscode from 'vscode';
import {
	LanguageClient,
	LanguageClientOptions,
	ServerOptions,
	Executable
} from 'vscode-languageclient';

import { exec } from 'child_process';
import { LanguageServerInstaller } from './languageServerInstaller';
import { runCommand } from './terraform_command';

let client: LanguageClient;

export function activate(context: vscode.ExtensionContext) {
	const commandOutput = vscode.window.createOutputChannel("Terraform");
	const config = vscode.workspace.getConfiguration("terraform");
	let useLs = config.get("languageServer.external");

	// Terraform Commands

	const rootPath = vscode.workspace.workspaceFolders[0].uri.path;
	context.subscriptions.push(
		vscode.workspace.onDidSaveTextDocument(document => {
			if (rootPath && config.get("fmtOnSave") && document.languageId == "terraform") {
				exec(`terraform fmt -recursive -no-color ${rootPath}`, (err, stdout, stderr) => {
					if (err) {
						commandOutput.appendLine(err.message);
					}
					if (stdout) {
						// Success! Do we want to log anything?
					}
					if (stderr) {
						commandOutput.appendLine(stderr);
					}
				});
			}
		}),
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
				if (event.affectsConfiguration('terraform.languageServer.external')) {
					const reloadMsg = 'Reload VSCode window to apply language server changes';
					vscode.window.showInformationMessage(reloadMsg, 'Reload').then((selected) => {
						if (selected === 'Reload') {
							vscode.commands.executeCommand('workbench.action.reloadWindow');
						}
					});
				}
			}
		)
	);
	
	if (useLs) {
		installThenStart(context, config);
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