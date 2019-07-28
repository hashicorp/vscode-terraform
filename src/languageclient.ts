import * as vscode from 'vscode';
import * as fs from 'fs';
import * as Path from 'path';
import {
    LanguageClient,
    LanguageClientOptions,
    ServerOptions
} from 'vscode-languageclient';
import { workspace } from 'vscode';
import { getConfiguration } from './configuration';
import { InstallLanguageServerCommand } from './commands/installLanguageServer';
import * as Octokit from '@octokit/rest';

export class ExperimentalLanguageClient {
    public get currentReleaseId(): string {
        return this.ctx.globalState.get("tfLspReleaseId");
    }
    public set currentReleaseId(v: string) {
        this.ctx.globalState.update("tfLspReleaseId", v);
    }
    private static client: LanguageClient;
    public static isRunning: boolean = false;
    private ctx: vscode.ExtensionContext;

    /**
     *  Create a new instance of the language server client
     */
    constructor(ctx: vscode.ExtensionContext) {
        this.ctx = ctx;
    }

    public static async stopIfRunning() {
        let langClient = ExperimentalLanguageClient.client;
        if (langClient === null) {
            return;
        }
        // Fixed (hopefully) by: https://github.com/juliosueiras/terraform-lsp/pull/11
        try {
            await langClient.stop();
        } catch {
            // Expected until PR merged
        }

        try {
            // Shutdown method on LSP not implemented :(
            //    `await langClient.stop();` fails
            //
            // We need the process to be stopped so we can overwrite the binary with the new version.
            // This is a hack for the time beind based on internal property of the languageClient object.
            const PID = langClient["_serverProcess"].pid;
            process.kill(PID, 9)
        } catch {
            // May occur until PR merged
        }

        this.isRunning = false;
    }
    public async start(prompt: boolean = true) {
        return new Promise(async (resolve, reject) => {
            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: "Starting Experimental Language Server",
                cancellable: false
            }, async (progress) => {
                try {
                    const serverLocation = getConfiguration().languageServer.pathToBinary || Path.join(this.ctx.extensionPath, "lspbin");

                    const thisPlatform = process.platform;
                    const executableName = thisPlatform === "win32" ? "terraform-lsp.exe" : "terraform-lsp";
                    const executablePath = Path.join(serverLocation, executableName);

                    if (!fs.existsSync(executablePath)) {
                        let continueInstall = await vscode.window.showInformationMessage(
                            "Would you like to install Terraform Language Server from juliosueiras/terraform-lsp? \n This provides experimental Terraform 0.12 support",
                            { modal: true },
                            "Install", "Abort");
                        if (continueInstall === "Abort") {
                            vscode.window.showErrorMessage("Terraform language server install aborted");
                            return;
                        }
                        progress.report({
                            message: "Downloading Language Server",
                            increment: 20
                        })
                        vscode.commands.executeCommand(InstallLanguageServerCommand.CommandName);
                    }

                    progress.report({
                        message: "Initializing Language Server",
                        increment: 40
                    })

                    let serverOptions: ServerOptions = {
                        command: executablePath,
                        args: [],
                        options: {
                            env: {
                                ...process.env
                            }
                        }
                    };

                    // Options to control the language client
                    let clientOptions: LanguageClientOptions = {
                        documentSelector: [{ scheme: 'file', language: 'terraform' }],
                        synchronize: {
                            configurationSection: 'terraformLanguageServer',
                            // Notify the server about file changes to '.clientrc files contained in the workspace
                            fileEvents: workspace.createFileSystemWatcher('**/*.tf'),
                        }
                    };

                    // Create the language client and start the client.
                    let langClient = new LanguageClient(
                        'terraformLanguageServer',
                        'Language Server',
                        serverOptions,
                        clientOptions,
                        true
                    );

                    ExperimentalLanguageClient.client = langClient;

                    langClient.trace = 2;

                    langClient.onReady().then(() => {
                        const capabilities = langClient.initializeResult && langClient.initializeResult.capabilities;
                        if (!capabilities) {
                            return vscode.window.showErrorMessage('The language server is not able to serve any features at the moment.');
                        } else {

                            progress.report({
                                message: "Language Server Ready",
                                increment: 100
                            })
                            ExperimentalLanguageClient.isRunning = true;

                            resolve();
                        }
                    });

                    // Start the client. This will also launch the server
                    this.ctx.subscriptions.push(langClient.start());

                    try {
                        // After server is running lets do a check to see if a newer one exists
                        const octokit = new Octokit();
                        const release = await octokit.repos.getLatestRelease({
                            owner: 'juliosueiras',
                            repo: 'terraform-lsp'
                        });

                        if (this.currentReleaseId !== release.data.id.toString()) {
                            vscode.window.showInformationMessage(`A newer Lanaguage Server is available ${release.data.tag_name}. Run the 'Install/Update Language Server' command to update`);
                        }
                    } catch (e) {
                        return vscode.window.showErrorMessage(`Failed checking for newer language server version. Error: ${e}`);
                    }

                } catch (e) {
                    reject(e);
                }
            });
        });
    }
}