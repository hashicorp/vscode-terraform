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

	// Subscriptions
	context.subscriptions.push(
		vscode.commands.registerCommand('terraform.enableLanguageServer', async () => {
			await stopClients();
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
			await startClients(command, config.get("languageServer.args"));
			// TODO: this throws as an unregistered configuration in this callback?
			// in theory this could cause an infinite loop with the reload hook below
			// return config.update("languageServer.external", true, vscode.ConfigurationTarget.Global);
		}),
		vscode.commands.registerCommand('terraform.disableLanguageServer', async () => {
			await stopClients();
			// TODO: this throws as an unregistered configuration in this callback?
			// in theory this could cause an infinite loop with the reload hook below
			// return config.update("languageServer.external", false, vscode.ConfigurationTarget.Global);
		}),
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
		),
	);

	const useLs: boolean = config.get("languageServer.external");
	if (useLs) {
		return vscode.commands.executeCommand("terraform.enableLanguageServer");
	}
}

export function deactivate() {
	return stopClients();
}

async function startClients(command: string, serverArgs: string[], folders = workspaceFolders()) {
	let disposables: vscode.Disposable[] = [];
	for (const folder of folders) {
		const client = newClient(command, serverArgs, folder);
		disposables.push(client.start());
		clients.set(folder, client);
	}
	return disposables
}

function newClient(cmd: string, serverArgs: string[], folder: string) {
	const binaryName = cmd.split("/").pop();
	const channelName = `${binaryName}/${folder}`
	const lsConfig = vscode.workspace.getConfiguration("terraform-ls");
	let serverOptions: ServerOptions;
	let initializationOptions = { rootModulePaths: lsConfig.get("rootModules") };

	const setup = vscode.window.createOutputChannel(channelName);
	setup.appendLine(`Launching language server: ${cmd} ${serverArgs.join(" ")} for folder: ${folder}`);

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

	return new LanguageClient(
		`languageServer/${folder}`,
		`Language Server: ${folder}`,
		serverOptions,
		clientOptions
	);
}

async function stopClients(folders = workspaceFolders()) {
	let promises: Thenable<void>[] = [];
	for (const folder of folders) {
		if (clients.has(folder)) {
			promises.push(clients.get(folder).stop());
			clients.delete(folder);
		} else {
			console.error(`Attempted to stop a client for folder: ${folder} but no client exists`);
		}
	}
	return Promise.all(promises);
}

function workspaceFolders(): string[] {
	return vscode.workspace.workspaceFolders ? vscode.workspace.workspaceFolders.map(folder => {
		let result = folder.uri.toString();
		if (result.charAt(result.length - 1) !== '/') {
			result = result + '/';
		}
		return result;
	}).sort((a, b) => a.length - b.length) : [];
}
