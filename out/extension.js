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
const child_process_1 = require("child_process");
const languageServerInstaller_1 = require("./languageServerInstaller");
const terraform_command_1 = require("./terraform_command");
let client;
function activate(context) {
    const commandOutput = vscode.window.createOutputChannel("Terraform");
    const config = vscode.workspace.getConfiguration("terraform");
    let useLs = config.get("languageServer.external");
    // Terraform Commands
    const rootPath = vscode.workspace.workspaceFolders[0].uri.path;
    context.subscriptions.push(vscode.workspace.onDidSaveTextDocument(document => {
        if (rootPath && config.get("fmtOnSave") && document.languageId == "terraform") {
            child_process_1.exec(`terraform fmt -recursive -no-color ${rootPath}`, (err, stdout, stderr) => {
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
    }), vscode.commands.registerCommand('terraform.init', () => {
        terraform_command_1.runCommand(rootPath, commandOutput, 'init');
    }), vscode.commands.registerCommand('terraform.plan', () => {
        terraform_command_1.runCommand(rootPath, commandOutput, 'plan');
    }), vscode.commands.registerCommand('terraform.validate', () => {
        terraform_command_1.runCommand(rootPath, commandOutput, 'validate');
    }));
    // Language Server
    context.subscriptions.push(vscode.commands.registerCommand('terraform.installLanguageServer', () => {
        installThenStart(context, config);
    }), vscode.commands.registerCommand('terraform.toggleLanguageServer', () => {
        stopLsClient();
        if (useLs) {
            useLs = false;
        }
        else {
            useLs = true;
            installThenStart(context, config);
        }
        config.update("languageServer.external", useLs, vscode.ConfigurationTarget.Global);
    }));
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
        installThenStart(context, config);
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
        let serverOptions;
        const setup = vscode.window.createOutputChannel("Language Server");
        setup.appendLine("Launching language server...");
        const executable = {
            command: cmd,
            args: config.get("languageServer.args"),
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