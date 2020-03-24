import * as vscode from 'vscode';
import {
	LanguageClient,
	LanguageClientOptions,
	ServerOptions,
	Executable
} from 'vscode-languageclient';

let client: LanguageClient;

export function activate(context: vscode.ExtensionContext) {
	let config = vscode.workspace.getConfiguration("terraform");
	let useLs = config.get("languageServer.external");

	context.subscriptions.push(
		vscode.commands.registerCommand('terraform.toggleLanguageServer', () => {
			if (useLs) {
				useLs = false;
				stopLsClient(config);
			} else {
				useLs = true;
				startLsClient(config);
			}
			config.update("languageServer.external", useLs, vscode.ConfigurationTarget.Global);
		})
	);

	// context.subscriptions.push(
	// 	vscode.commands.registerCommand('terraform.installLanguageServer', () => {

	// 	})
	// );

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
		startLsClient(config);
	}
}

export function deactivate(): Thenable<void> | undefined {
	if (!client) {
		return undefined;
	}
	return client.stop();
}

function startLsClient(config: vscode.WorkspaceConfiguration) {
	let serverOptions: ServerOptions;
	let setup = vscode.window.createOutputChannel("Language Server");

	setup.appendLine("Launching language server...")
	let cmd: string = config.get("languageServer.pathToBinary") || '';

	let executable: Executable = {
		command: cmd,
		args: config.get("languageServer.args"),
		options: {}
	}
	serverOptions = {
		run: executable,
		debug: executable
	};

	let clientOptions: LanguageClientOptions = {
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

function stopLsClient(config: vscode.WorkspaceConfiguration) {
	return client.stop();
}