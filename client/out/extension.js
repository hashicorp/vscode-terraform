"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const vscode_languageclient_1 = require("vscode-languageclient");
let client;
function activate(context) {
    let config = vscode.workspace.getConfiguration("terraform");
    let useLs = config.get("languageServer.external");
    context.subscriptions.push(vscode.commands.registerCommand('terraform.toggleLanguageServer', () => {
        if (useLs) {
            useLs = false;
            stopLsClient(config);
        }
        else {
            useLs = true;
            startLsClient(config);
        }
        config.update("languageServer.external", useLs, vscode.ConfigurationTarget.Global);
    }));
    // context.subscriptions.push(
    // 	vscode.commands.registerCommand('terraform.installLanguageServer', () => {
    // 	})
    // );
    context.subscriptions.push(vscode.workspace.onDidChangeConfiguration((event) => {
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
    }));
    if (useLs) {
        startLsClient(config);
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
function startLsClient(config) {
    let serverOptions;
    let setup = vscode.window.createOutputChannel("Language Server");
    setup.appendLine("Launching language server...");
    let cmd = config.get("languageServer.pathToBinary") || '';
    let executable = {
        command: cmd,
        args: config.get("languageServer.args"),
        options: {}
    };
    serverOptions = {
        run: executable,
        debug: executable
    };
    let clientOptions = {
        documentSelector: [{ scheme: 'file', language: 'terraform' }],
        synchronize: {
            fileEvents: vscode.workspace.createFileSystemWatcher('**/*.tf')
        },
    };
    client = new vscode_languageclient_1.LanguageClient('languageServer', 'Language Server', serverOptions, clientOptions);
    return client.start();
}
function stopLsClient(config) {
    return client.stop();
}
//# sourceMappingURL=extension.js.map