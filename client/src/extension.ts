import * as path from 'path';
import { workspace, ExtensionContext, window } from 'vscode';

import {
	LanguageClient,
	LanguageClientOptions,
	ServerOptions,
	Executable,
	TransportKind
} from 'vscode-languageclient';

let client: LanguageClient;

export function activate(context: ExtensionContext) {
	let serverOptions: ServerOptions;

	let setup = window.createOutputChannel("Extension Setup");

	let config = workspace.getConfiguration("languageServer");
	let useExternal = config.get("external")
	if (useExternal) {
		setup.appendLine("Launching external language server...")
		let cmd: string = config.get("pathToBinary") || '';

		let executable: Executable = {
			command: cmd,
			args: config.get("args"),
			options: {}
		}
		serverOptions = {
			run: executable,
			debug: executable
		};

		// Options to control the language client
		let clientOptions: LanguageClientOptions = {
			documentSelector: [{ scheme: 'file', language: 'terraform' }],
			synchronize: {
				fileEvents: workspace.createFileSystemWatcher('**/*.tf')
			},
		};

		// Create the language client and start the client.
		client = new LanguageClient(
			'languageServer',
			'Language Server',
			serverOptions,
			clientOptions
		);

		// Start the client. This will also launch the server
		client.start();
	}
}

export function deactivate(): Thenable<void> | undefined {
	if (!client) {
		return undefined;
	}
	return client.stop();
}
