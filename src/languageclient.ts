import * as vscode from 'vscode';
import * as fs from 'fs';
import * as Path from 'path';
import * as ps from 'process';
import * as glob from 'glob';
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
            process.kill(PID, 9);
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

                    if (!fs.existsSync(serverLocation)) {
                        fs.mkdirSync(serverLocation);
                    }

                    const thisPlatform = process.platform;
                    const executableName = thisPlatform === "win32" ? "terraform-lsp.exe" : "terraform-lsp";
                    let executablePath = Path.join(serverLocation, executableName);


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
                        });
                        await vscode.commands.executeCommand('terraform.' + InstallLanguageServerCommand.CommandName);
                    }


                    // To work around issues with provider discovery in the current LSP
                    // we install some common providers in the ./lspbin directory
                    // this also enables use with tf projects where `tf init` hasn't been run
                    // see https://github.com/juliosueiras/terraform-lsp/issues/12 for details
                    progress.report({
                        message: "Installing/Downloading common providers",
                        increment: 30
                    });
                    try {
                        await this.installCommonProviders(serverLocation);
                    } catch (e) {
                        vscode.window.showErrorMessage(`Failed to download common providers: ${e}`);
                    }

                    progress.report({
                        message: "Initializing Language Server",
                        increment: 50
                    });

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
                            });
                            ExperimentalLanguageClient.isRunning = true;

                            resolve();
                        }
                    });

                    progress.report({
                        message: "Initializing Language Server",
                        increment: 70
                    });

                    // Start the client. This will also launch the server
                    this.ctx.subscriptions.push(langClient.start());

                    try {
                        await this.checkForUpdatedLsp();
                    } catch (e) {
                        return vscode.window.showErrorMessage(`Failed checking for newer language server version. Error: ${e}`);
                    }

                } catch (e) {
                    vscode.window.showErrorMessage(`Failed starting language server. Error: ${e}`);
                    reject(e);
                }
            });
        });

    }

    private async checkForUpdatedLsp() {
        if (this.shouldCheckForLastestRelease()) {
            // After server is running lets do a check to see if a newer one exists
            const octokit = new Octokit();
            const release = await octokit.repos.getLatestRelease({
                owner: 'juliosueiras',
                repo: 'terraform-lsp'
            });
            if (this.currentReleaseId !== release.data.id.toString()) {
                vscode.window.showInformationMessage(`A newer Lanaguage Server is available ${release.data.tag_name}. Run the 'Install/Update Language Server' command to update`);
            }
        }
    }

    private async installCommonProviders(serverLocation: string) {
        let terminal = vscode.window.createTerminal("Terraform: Install providers");
        const defaultProvidersPath = Path.join(serverLocation, "providers.tf");
        if (!fs.existsSync(defaultProvidersPath)) {
            fs.writeFileSync(defaultProvidersPath, `
provider "aws" {}
provider "azurerm" {}
provider "google" {}
provider "alicloud" {}
provider "oci" {}
provider "helm" {}
provider "kubernetes" {}
provider "random" {}
provider "null" {}
provider "external" {}
provider "template" {}
provider "archive" {}
                        `);
        }
        const defaultProvidersPluginsPath = Path.join(serverLocation, ".terraform", "plugins");
        if (!fs.existsSync(defaultProvidersPluginsPath)) {
            terminal.show();
            terminal.sendText(`cd "${serverLocation}"`);
            terminal.sendText(`terraform init`);
            terminal.sendText(`echo "Done"`);
            terminal.sendText(`exit 0`);
            let terminalPid = await terminal.processId;
            // Hack to wait on the process to exit
            let isRunning = true;
            while (isRunning) {
                try {
                    ps.kill(terminalPid, 0);
                } catch (e) {
                    isRunning = false;
                }
            }
        }
        const providerBinaries = glob.sync(
            Path.join(
                serverLocation,
                ".terraform",
                "plugins",
                "**",
                "terraform-provider*")
        );
        if (!providerBinaries) {
            return vscode.window.showErrorMessage(`Failed to copy default providers into lspbin. Extension may not function correctly`);
        }
        providerBinaries.forEach(file => {
            const newLocation = Path.join(serverLocation, Path.basename(file));
            fs.copyFileSync(file, newLocation);
            fs.chmodSync(newLocation, '777');
        });
    }

    /**
     * Limit the calls to the github api
     * so updates are only checked for once a day
     * no matter how may times vscode is launched
     */
    private shouldCheckForLastestRelease(): boolean {
        const lastUpdateKey = "tfLspLastUpdateCheck";
        let dateLastCheckedValue = this.ctx.globalState.get(lastUpdateKey) as string;
        if (dateLastCheckedValue === undefined) {
            this.ctx.globalState.update(lastUpdateKey, new Date());
            return true;
        }

        const dateLastChecked = new Date(dateLastCheckedValue);
        const dateNow = new Date();

        // Only run the check once a day
        if (dateNow.getDay() !== dateLastChecked.getDay()) {
            this.ctx.globalState.update(lastUpdateKey, new Date());
            return true;
        }

        return false;
    }
}
