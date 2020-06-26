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
			{ "external": true, "args": ["serve"], "enabled": undefined },
			true
		)
	}
	let useLs = config.get("languageServer.external");

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

	// Language Server

	context.subscriptions.push(
		vscode.commands.registerCommand('terraform.enableLanguageServer', () => {
			stopLsClient();
			installThenStart(context, config);
			config.update("languageServer.external", true, vscode.ConfigurationTarget.Global);
		}),
		vscode.commands.registerCommand('terraform.disableLanguageServer', () => {
			config.update("languageServer.external", false, vscode.ConfigurationTarget.Global);
			stopLsClient();
		})
	);

	context.subscriptions.push(
		vscode.workspace.onDidChangeConfiguration(
			(event: vscode.ConfigurationChangeEvent) => {
				if (event.affectsConfiguration("terraform")) {
					const reloadMsg = "Reload VSCode window to apply language server changes";
					vscode.window.showInformationMessage(reloadMsg, "Reload").then((selected) => {
						if (selected === "Reload") {
							vscode.commands.executeCommand("workbench.action.reloadWindow");
						}
					});	
				} else {
					return;
				}
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
		vscode.window.showErrorMessage(err);
		});
	}
}

async function startLsClient(cmd: string, config: vscode.WorkspaceConfiguration) {
	const binaryName = cmd.split("/").pop();
	let serverOptions: ServerOptions;
	let serverArgs: string[] = config.get("languageServer.args");
	let additionalArgs: string[];

	if (config.has("rootModules")) {
		const rootModules: string[] = config.get("rootModules");
		additionalArgs = rootModules.map(module => `-root-module=${module}`);
	}
	const args = serverArgs.concat(additionalArgs);

	const setup = vscode.window.createOutputChannel(binaryName);
	setup.appendLine(`Launching language server: ${cmd} ${args.join(" ")}`);

	const executable: Executable = {
		command: cmd,
		args: args,
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
		revealOutputChannelOn: 4 // hide always
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
