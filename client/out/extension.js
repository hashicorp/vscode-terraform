"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_1 = require("vscode");
const vscode_languageclient_1 = require("vscode-languageclient");
let client;
function activate(context) {
    let serverOptions;
    let setup = vscode_1.window.createOutputChannel("Extension Setup");
    let config = vscode_1.workspace.getConfiguration("languageServer");
    let useExternal = config.get("external");
    if (useExternal) {
        setup.appendLine("Launching external language server...");
        let cmd = config.get("pathToBinary") || '';
        let executable = {
            command: cmd,
            args: config.get("args"),
            options: {}
        };
        serverOptions = {
            run: executable,
            debug: executable
        };
        // Options to control the language client
        let clientOptions = {
            documentSelector: [{ scheme: 'file', language: 'terraform' }],
            synchronize: {
                fileEvents: vscode_1.workspace.createFileSystemWatcher('**/*.tf')
            },
        };
        // Create the language client and start the client.
        client = new vscode_languageclient_1.LanguageClient('languageServer', 'Language Server', serverOptions, clientOptions);
        // Start the client. This will also launch the server
        client.start();
    }
}
exports.activate = activate;
function deactivate() {
    if (!client) {
        return undefined;
    }
    return client.stop();
}
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map