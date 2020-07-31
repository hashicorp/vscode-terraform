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

export async function activate(context: vscode.ExtensionContext) {
	const commandOutput = vscode.window.createOutputChannel("Terraform");
	const config = vscode.workspace.getConfiguration("terraform");
	// get rid of pre-2.0.0 settings
	if (config.has('languageServer.enabled')) {
		const defaults = require("../package.json").contributes.configuration.properties['terraform.languageServer'].default;
		await config.update('languageServer',
			Object.assign(defaults, { enabled: undefined }),
			true
		)
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

	// Language Server

	context.subscriptions.push(
		vscode.commands.registerCommand('terraform.enableLanguageServer', async () => {
			await stopClients();
			await startClients(context, config);
			// TODO: this throws as an unregistered configuration in this callback?
			// in theory this could cause an infinite loop with the reload hook below
			// return config.update("languageServer.external", true, vscode.ConfigurationTarget.Global);
		}),
		vscode.commands.registerCommand('terraform.disableLanguageServer', async () => {
			await stopClients();
			// TODO: this throws as an unregistered configuration in this callback?
			// in theory this could cause an infinite loop with the reload hook below
			// return config.update("languageServer.external", false, vscode.ConfigurationTarget.Global);
		})
	);

	context.subscriptions.push(
		vscode.workspace.onDidChangeConfiguration(
			async (event: vscode.ConfigurationChangeEvent) => {
				if (event.affectsConfiguration("terraform") || event.affectsConfiguration("terraform-ls")) {
					const reloadMsg = "Reload VSCode window to apply language server changes";
					const selected = await vscode.window.showInformationMessage(reloadMsg, "Reload");
					if (selected === "Reload") {
						vscode.commands.executeCommand("workbench.action.reloadWindow");
					}
				}
			}
		)
	);

	const useLs: boolean = config.get("languageServer.external");
	if (useLs) {
		return vscode.commands.executeCommand("terraform.enableLanguageServer");
	}
}

export function deactivate() {
	return stopClients();
}

async function startClients(context: vscode.ExtensionContext, config: vscode.WorkspaceConfiguration) {
	let command: string = config.get("languageServer.pathToBinary");
	if (!command) { // Skip install/upgrade if user has set custom binary path
		const installDir = `${context.extensionPath}/lsp`;
		try {
			await (new LanguageServerInstaller).install(installDir);
		} catch (err) {
			vscode.window.showErrorMessage(err);
			throw err;
		}
		command = `${installDir}/terraform-ls`;
	}
	return startClient(command, config);
}

function startClient(cmd: string, config: vscode.WorkspaceConfiguration) {
	const binaryName = cmd.split("/").pop();
	const lsConfig = vscode.workspace.getConfiguration("terraform-ls");
	const serverArgs: string[] = config.get("languageServer.args");
	let serverOptions: ServerOptions;
	let initializationOptions = { rootModulePaths: lsConfig.get("rootModules") };

	const setup = vscode.window.createOutputChannel(binaryName);
	setup.appendLine(`Launching language server: ${cmd} ${serverArgs.join(" ")}`);

	const executable: Executable = {
		command: cmd,
		args: serverArgs,
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
		initializationOptions: initializationOptions,
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

async function stopClients() {
	if (!client) {
		return;
	}
	return client.stop();
}
