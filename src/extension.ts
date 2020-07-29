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
		await config.update('languageServer',
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
		vscode.commands.registerCommand('terraform.enableLanguageServer', async () => {
			await stopLsClient();
			await installThenStart(context, config);
			return config.update("languageServer.external", true, vscode.ConfigurationTarget.Global);
		}),
		vscode.commands.registerCommand('terraform.disableLanguageServer', async () => {
			await config.update("languageServer.external", false, vscode.ConfigurationTarget.Global);
			return stopLsClient();
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

	if (useLs) {
		return installThenStart(context, config);
	}
}

export function deactivate() {
	return stopLsClient();
}

async function installThenStart(context: vscode.ExtensionContext, config: vscode.WorkspaceConfiguration) {
	const command: string = config.get("languageServer.pathToBinary");
	if (command) { // Skip install/upgrade if user has set custom binary path
		return startLsClient(command, config);
	} else {
		const installer = new LanguageServerInstaller;
		const installDir = `${context.extensionPath}/lsp`;

		try {
			await installer.install(installDir);
		} catch (err) {
			vscode.window.showErrorMessage(err);
			throw err;
		}
		return startLsClient(`${installDir}/terraform-ls`, config);
	}
}

function startLsClient(cmd: string, config: vscode.WorkspaceConfiguration) {
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

async function stopLsClient() {
	if (!client) {
		return;
	}
	return client.stop();
}
