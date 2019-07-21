import * as vscode from 'vscode';
import * as fs from 'fs';
import * as os from 'os';
import * as Path from 'path';
import * as Octokit from '@octokit/rest';
import { HttpClient } from 'typed-rest-client/HttpClient';
import {
    LanguageClient,
    LanguageClientOptions,
    ServerOptions
} from 'vscode-languageclient';
import { workspace, window, QuickPickItem } from 'vscode';
import * as tar from 'tar';
import { getConfiguration } from './configuration';
import { Command } from './commands/command';

export class ExperimentalLanguageClient {
    public installLSPCommandName = 'installLanguageServer';
    public async start(ctx: vscode.ExtensionContext) {
        vscode.window.showInformationMessage("Starting experimental Terraform Language server")
        const serverLocation = getConfiguration().languageServer.pathToBinary || Path.join(ctx.extensionPath, "lspbin");

        const thisPlatform = process.platform;

        const executableName = thisPlatform === "win32" ? "terraform-lsp.exe" : "terraform-lsp";
        const executablePath = Path.join(serverLocation, executableName);

        if (!fs.existsSync(executablePath)) {
            let continueInstall = await vscode.window.showInformationMessage(
                "Would you like to install Terraform Language Server from juliosueiras/terraform-lsp? \n This provides experimental Terraform 0.12 support",
                "Install", "Abort");
            if (continueInstall === "Abort") {
                vscode.window.showErrorMessage("Terraform language server install aborted");
                return;
            }
            await this.installLanguageServer(thisPlatform, serverLocation);
        }

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

        langClient.trace = 2;

        langClient.onReady().then(() => {
            const capabilities = langClient.initializeResult && langClient.initializeResult.capabilities;
            if (!capabilities) {
                return vscode.window.showErrorMessage('The language server is not able to serve any features at the moment.');
            } else {
                vscode.window.showInformationMessage('Terraform Language server started.')
            }
        });

        // Start the client. This will also launch the server
        ctx.subscriptions.push(langClient.start());

        // Register command to re-run installer
        const commandHandler = async () => {
            try {
                await langClient.stop();
            } catch {
                // Expected
            }
            // Todo:
            // Shutdown method on LSP not implemented :(
            //    `await langClient.stop();` fails
            //
            // We need the process to be stopped so we can overwrite the binary with the new version.
            // This is a hack for the time beind based on internal property of the languageClient object.
            const PID = langClient["_serverProcess"].pid;
            process.kill(PID, 9)

            await this.installLanguageServer(thisPlatform, serverLocation);
            const action = 'Reload';

            vscode.window
                .showInformationMessage(
                    `Reload window in order for the new language server configuration to take effect.`,
                    action
                )
                .then(selectedAction => {
                    if (selectedAction === action) {
                        vscode.commands.executeCommand('workbench.action.reloadWindow');
                    }
                });
        };
        Command.dynamicRegister(this.installLSPCommandName, commandHandler);
    }

    public async installLanguageServer(platform: string, path: string): Promise<void> {
        // Create dir for lsp binary if it doesn't exist
        if (!fs.existsSync(path)) {
            fs.mkdirSync(path);
        }
        const downloadedZipFile = Path.join(path, 'terraform-lsp.tar.gz');
        // Download language server
        const octokit = new Octokit();

        // What releases are available?
        const availableReleses = await octokit.repos.listReleases({
            owner: 'juliosueiras',
            repo: 'terraform-lsp'
        })
        let releaseOptions = [];
        availableReleses.data.forEach(r => {
            releaseOptions.push({
                label: r.name,
                description: `Is Prerelease version?: ${r.prerelease} Tag: ${r.tag_name}`,
                detail: r.id.toString()
            } as QuickPickItem);
        });

        let choice = await vscode.window.showQuickPick(releaseOptions, { placeHolder: "Terraform language server install - please pick a version" })
        if (choice === null) {
            vscode.window.showErrorMessage("You must pick a version to complete installation");
            return;
        }

        const release = await octokit.repos.getRelease({
            owner: 'juliosueiras',
            repo: 'terraform-lsp',
            release_id: choice.detail
        })

        // The github releases refer to `windows` not `win32` so
        // change the platform string if we're on `win32`
        platform = platform === "win32" ? "windows" : platform;

        let downloadUrl = "NotFound";
        release.data.assets.forEach(asset => {
            if (!asset.name.endsWith('.tar.gz')) {
                return;
            }

            if (asset.name.includes(platform)) {
                downloadUrl = asset.browser_download_url;
            }
        });

        if (downloadUrl === "NotFound") {
            vscode.window.showErrorMessage(`Failed to install, releases for the Lanugage server didn't contain a release for your platform: ${platform}`);
            return;
        }

        const client = new HttpClient("clientTest");
        const response = await client.get(downloadUrl);
        const file: NodeJS.WritableStream = fs.createWriteStream(downloadedZipFile);

        if (response.message.statusCode !== 200) {
            const err: Error = new Error(`Unexpected HTTP response: ${response.message.statusCode}`);
            err["httpStatusCode"] = response.message.statusCode;
            vscode.window.showErrorMessage(`Downloading Terraform language server failed with ${err}`);
            return;
        }

        return new Promise<void>((resolve, reject) => {
            file.on("error", (err) => reject(err));
            const stream = response.message.pipe(file);
            stream.on("close", () => {
                try {
                    const unzipStream = fs.createReadStream(downloadedZipFile).pipe(
                        tar.x({
                            cwd: path,
                            onwarn: (message, data) => {
                                console.log(message);
                            }
                        })
                    )
                    unzipStream.on("finish", resolve);
                } catch (err) {
                    vscode.window.showErrorMessage(`Unzipping Terraform language server failed with ${err}`);
                    reject(err);
                }
            });
        });
    }
}