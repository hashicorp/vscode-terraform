import * as vscode from 'vscode';
import {
	LanguageClient,
	LanguageClientOptions,
	ServerOptions,
	Executable
} from 'vscode-languageclient';
import { exec, execFile } from 'child_process';

let client: LanguageClient;

export function activate(context: vscode.ExtensionContext) {
	let commandOutput = vscode.window.createOutputChannel("Terraform");
	let config = vscode.workspace.getConfiguration("terraform");
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
		vscode.commands.registerCommand('terraform.validate', () => {
			if (rootPath) {
				commandOutput.show();
				exec(`terraform validate -no-color ${rootPath}`, (err, stdout, stderr) => {
					if (err) {
						commandOutput.appendLine(err.message);
					}
					if (stdout) {
						vscode.window.showInformationMessage(stdout);
					}
					if (stderr) {
						commandOutput.appendLine(stderr);
					}
				});
			}
		})
	);

	// Language Server

	context.subscriptions.push(
		vscode.commands.registerCommand('terraform.toggleLanguageServer', () => {
			if (useLs) {
				useLs = false;
				stopLsClient();
			} else {
				useLs = true;
				installLs(config);
				startLsClient(config);
			}
			config.update("languageServer.external", useLs, vscode.ConfigurationTarget.Global);
		})
	);

	context.subscriptions.push(
		vscode.commands.registerCommand('terraform.installLanguageServer', () => {
			installLs(config);
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
		startLsClient(config);
	}
}

export function deactivate(): Thenable<void> | undefined {
	if (!client) {
		return undefined;
	}
	return client.stop();
}

async function installLs(config: vscode.WorkspaceConfiguration) {
	// find out if we have it installed
	// check the version
	const lspPath: string = config.get("languageServer.pathToBinary") || '';
	execFile(lspPath, ['terraform-ls', '-v'], (err, stdout, stderr) => {
		if (err) {
			console.log(`Error when running the command "terraform-ls -v": `, err);
			return;
		}
		if (stderr) {
			vscode.window.showErrorMessage('No terraform-ls binary found');
			return;
		}
		console.log('Found terraform-ls version ', stdout);
	})
	// install if not present
	// offer to install a new one if old version is here
}

function startLsClient(config: vscode.WorkspaceConfiguration) {
	let serverOptions: ServerOptions;
	let setup = vscode.window.createOutputChannel("Language Server");

	setup.appendLine("Launching language server...");
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

function stopLsClient() {
	if (!client) {
		return;
	}
	return client.stop();
}