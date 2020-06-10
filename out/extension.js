"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const vscode_languageclient_1 = require("vscode-languageclient");
const languageServerInstaller_1 = require("./languageServerInstaller");
let client;
function activate(context) {
    const commandOutput = vscode.window.createOutputChannel("Terraform");
    const config = vscode.workspace.getConfiguration("terraform");
    // get rid of pre-2.0.0 settings
    if (config.has('languageServer.enabled')) {
        config.update('languageServer', { "external": true, "args": ["serve"], "enabled": undefined }, true);
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
    context.subscriptions.push(vscode.commands.registerCommand('terraform.enableLanguageServer', () => {
        stopLsClient();
        installThenStart(context, config);
        config.update("languageServer.external", true, vscode.ConfigurationTarget.Global);
    }), vscode.commands.registerCommand('terraform.disableLanguageServer', () => {
        config.update("languageServer.external", false, vscode.ConfigurationTarget.Global);
        stopLsClient();
    }));
    context.subscriptions.push(vscode.workspace.onDidChangeConfiguration((event) => {
        if (!event.affectsConfiguration('terraform.languageServer')) {
            return;
        }
        const reloadMsg = 'Reload VSCode window to apply language server changes';
        vscode.window.showInformationMessage(reloadMsg, 'Reload').then((selected) => {
            if (selected === 'Reload') {
                vscode.commands.executeCommand('workbench.action.reloadWindow');
            }
        });
    }));
    if (useLs) {
        return installThenStart(context, config);
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
function installThenStart(context, config) {
    return __awaiter(this, void 0, void 0, function* () {
        const command = config.get("languageServer.pathToBinary");
        if (command) { // Skip install/upgrade if user has set custom binary path
            startLsClient(command, config);
        }
        else {
            const installer = new languageServerInstaller_1.LanguageServerInstaller;
            const installDir = `${context.extensionPath}/lsp`;
            installer.install(installDir).then(() => {
                config.update("languageServer.external", true, vscode.ConfigurationTarget.Global);
                startLsClient(`${installDir}/terraform-ls`, config);
            }).catch((err) => {
                config.update("languageServer.external", false, vscode.ConfigurationTarget.Global);
                console.log(err);
            });
        }
    });
}
function startLsClient(cmd, config) {
    return __awaiter(this, void 0, void 0, function* () {
        const binaryName = cmd.split("/").pop();
        let serverOptions;
        let serverArgs = config.get("languageServer.args");
        const setup = vscode.window.createOutputChannel(binaryName);
        setup.appendLine(`Launching language server: ${cmd} ${serverArgs}`);
        const executable = {
            command: cmd,
            args: serverArgs,
            options: {}
        };
        serverOptions = {
            run: executable,
            debug: executable
        };
        const clientOptions = {
            documentSelector: [{ scheme: 'file', language: 'terraform' }],
            synchronize: {
                fileEvents: vscode.workspace.createFileSystemWatcher('**/*.tf')
            },
            outputChannel: setup,
            revealOutputChannelOn: 3 // error
        };
        client = new vscode_languageclient_1.LanguageClient('languageServer', 'Language Server', serverOptions, clientOptions);
        return client.start();
    });
}
function stopLsClient() {
    if (!client) {
        return;
    }
    return client.stop();
}
//# sourceMappingURL=extension.js.map