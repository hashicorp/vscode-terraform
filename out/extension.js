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
let clients = new Map();
function sortedWorkspaceFolders() {
    const folders = vscode.workspace.workspaceFolders ? vscode.workspace.workspaceFolders.map(folder => {
        let result = folder.uri.toString();
        if (result.charAt(result.length - 1) !== '/') {
            result = result + '/';
        }
        return result;
    }).sort((a, b) => {
        return a.length - b.length;
    }) : [];
    return folders;
}
function getOuterMostWorkspaceFolder(folder) {
    let sorted = sortedWorkspaceFolders();
    for (let element of sorted) {
        let uri = folder.uri.toString();
        if (uri.charAt(uri.length - 1) !== '/') {
            uri = uri + '/';
        }
        if (uri.startsWith(element)) {
            return vscode.workspace.getWorkspaceFolder(vscode.Uri.parse(element));
        }
    }
    return folder;
}
function installLs(context, config) {
    return __awaiter(this, void 0, void 0, function* () {
        const command = config.get("languageServer.pathToBinary");
        if (command) { // Skip install/upgrade if user has set custom binary path
            return command;
        }
        const installer = new languageServerInstaller_1.LanguageServerInstaller;
        const installDir = `${context.extensionPath}/lsp`;
        console.log(`installing language server to ${installDir}`);
        try {
            console.log(`stopping...`);
            yield stopLsClients();
            console.log(`installing...`);
            yield installer.install(installDir);
            console.log(`installed`);
        }
        catch (e) {
            console.error(`unable to install language server ${e}`);
            vscode.window.showErrorMessage(e);
            throw e;
        }
        console.log(`language server installed`);
        return `${installDir}/terraform-ls`;
    });
}
function startLsClient(cmd, folder, config) {
    console.log(`starting ls client ${cmd} for folder ${folder.name}`);
    const binaryName = cmd.split("/").pop();
    const lsConfig = vscode.workspace.getConfiguration("terraform-ls", folder);
    const serverArgs = config.get("languageServer.args");
    let serverOptions;
    let initializationOptions = { rootModulePaths: lsConfig.get("rootModules") };
    const setup = vscode.window.createOutputChannel(binaryName);
    setup.appendLine(`Launching language server: ${cmd} ${serverArgs.join(" ")}`);
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
        diagnosticCollectionName: "terraform-ls",
        workspaceFolder: folder,
        synchronize: {
            fileEvents: vscode.workspace.createFileSystemWatcher('**/*.tf')
        },
        initializationOptions: initializationOptions,
        outputChannel: setup,
        revealOutputChannelOn: 4 // hide always
    };
    const client = new vscode_languageclient_1.LanguageClient('terraform-ls', 'Terraform Language Server', serverOptions, clientOptions);
    client.start();
    clients.set(folder.uri.toString(), client);
}
function installThenStartLsClients(context, config) {
    return __awaiter(this, void 0, void 0, function* () {
        const cmd = yield installLs(context, config);
        console.log("starting the LS clients");
        context.subscriptions.push(vscode.workspace.onDidChangeConfiguration((event) => {
            if (!event.affectsConfiguration("terraform") && !event.affectsConfiguration("terraform-ls")) {
                return;
            }
            const reloadMsg = "Reload VSCode window to apply language server changes";
            return vscode.window.showInformationMessage(reloadMsg, "Reload").then((selected) => {
                if (selected === "Reload") {
                    return vscode.commands.executeCommand("workbench.action.reloadWindow");
                }
            });
        }), vscode.workspace.onDidOpenTextDocument(document => didOpenTextDocument(cmd, document, context, config)), vscode.workspace.onDidChangeWorkspaceFolders((event) => {
            for (let folder of event.removed) {
                const client = clients.get(folder.uri.toString());
                if (client) {
                    clients.delete(folder.uri.toString());
                    client.stop();
                }
            }
        }));
        vscode.workspace.textDocuments.forEach(document => didOpenTextDocument(cmd, document, context, config));
    });
}
function stopLsClients() {
    return __awaiter(this, void 0, void 0, function* () {
        let promises = [];
        for (let client of clients.values()) {
            promises.push(client.stop());
        }
        clients.clear();
        return Promise.all(promises)
            .then(() => undefined);
    });
}
function enableLanguageServerCommand(context, config) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield config.update("languageServer.external", true, vscode.ConfigurationTarget.Global);
            yield installThenStartLsClients(context, config);
        }
        catch (e) {
            yield config.update("languageServer.external", false, vscode.ConfigurationTarget.Global);
            throw e;
        }
    });
}
function disableLanguageServerCommand(config) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield config.update("languageServer.external", false, vscode.ConfigurationTarget.Global);
            yield stopLsClients();
        }
        catch (e) {
            yield vscode.window.showErrorMessage(e);
            throw e;
        }
    });
}
function didOpenTextDocument(cmd, document, context, config) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log(`didOpenTextDocument ${document.uri}`);
        // TODO: handle untitled docs?
        const uri = document.uri;
        let folder = vscode.workspace.getWorkspaceFolder(uri);
        // Files outside a folder can't be handled. This might depend on the language.
        // Single file languages like JSON might handle files outside the workspace folders.
        if (!folder) {
            return;
        }
        // If we have nested workspace folders we only start a server on the outer most workspace folder.
        folder = getOuterMostWorkspaceFolder(folder);
        if (!clients.has(folder.uri.toString())) {
            startLsClient(cmd, folder, config);
        }
    });
}
function activate(context) {
    const commandOutput = vscode.window.createOutputChannel("Terraform");
    const config = vscode.workspace.getConfiguration("terraform");
    // get rid of pre-2.0.0 settings
    if (config.has('languageServer.enabled')) {
        config.update('languageServer', { "external": true, "args": ["serve"], "enabled": undefined }, true);
    }
    let useLs = config.get("languageServer.external");
    context.subscriptions.push(vscode.commands.registerCommand('terraform.enableLanguageServer', () => enableLanguageServerCommand(context, config)), vscode.commands.registerCommand('terraform.disableLanguageServer', () => disableLanguageServerCommand(config)));
    if (!useLs) {
        return;
    }
    installThenStartLsClients(context, config);
}
exports.activate = activate;
function deactivate() {
    return stopLsClients();
}
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map