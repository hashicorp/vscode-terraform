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
let client;
function activate(context) {
    let commandOutput = vscode.window.createOutputChannel("Terraform");
    let config = vscode.workspace.getConfiguration("terraform");
    let useLs = config.get("languageServer.external");
    context.subscriptions.push(vscode.commands.registerCommand('terraform.validate', () => {
        const rootPath = vscode.workspace.workspaceFolders[0].uri.path;
        if (rootPath) {
            commandOutput.show();
            child_process_1.exec(`terraform validate -no-color ${rootPath}`, (err, stdout, stderr) => {
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
    }));
    context.subscriptions.push(vscode.commands.registerCommand('terraform.toggleLanguageServer', () => {
        if (useLs) {
            useLs = false;
            stopLsClient();
        }
        else {
            useLs = true;
            installLs(config);
            startLsClient(config);
        }
        config.update("languageServer.external", useLs, vscode.ConfigurationTarget.Global);
    }));
    context.subscriptions.push(vscode.commands.registerCommand('terraform.installLanguageServer', () => {
        installLs(config);
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
function installLs(config) {
    return __awaiter(this, void 0, void 0, function* () {
        // find out if we have it installed
        // check the version
        const lspPath = config.get("languageServer.pathToBinary") || '';
        child_process_1.execFile(lspPath, ['terraform-ls', '-v'], (err, stdout, stderr) => {
            if (err) {
                console.log(`Error when running the command "terraform-ls -v": `, err);
                return;
            }
            if (stderr) {
                vscode.window.showErrorMessage('No terraform-ls binary found');
                return;
            }
            console.log('Found terraform-ls version ', stdout);
        });
        // install if not present
        // offer to install a new one if old version is here
    });
}
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
function stopLsClient() {
    if (!client) {
        return;
    }
    return client.stop();
}
//# sourceMappingURL=extension.js.map