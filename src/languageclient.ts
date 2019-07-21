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

export class ExperimentalLanguageClient {
    public async start(ctx: vscode.ExtensionContext) {
        const serverLocation = vscode.workspace
            .getConfiguration('terraform').get('languageServer.location') as string || Path.join(ctx.extensionPath, "lspbin");

        const thisPlatform = process.platform;

        const executableName = thisPlatform === "win32" ? "terraform-lsp.exe" : "terraform-lsp";
        const executablePath = Path.join(serverLocation, executableName);

        if (!fs.existsSync(executablePath)) {
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
        let l = new LanguageClient(
            'terraformLanguageServer',
            'Language Server',
            serverOptions,
            clientOptions,
            true
        );

        l.trace = 2;

        l.onReady().then(() => {
            const capabilities = l.initializeResult && l.initializeResult.capabilities;
            if (!capabilities) {
                return vscode.window.showErrorMessage('The language server is not able to serve any features at the moment.');
            }
        });

        // Start the client. This will also launch the server
        ctx.subscriptions.push(l.start());
    }

    public async installLanguageServer(platform: string, path: string): Promise<void> {
        let continueInstall = await vscode.window.showInformationMessage(
            "Would you like to install Terraform Language Server from juliosueiras/terraform-lsp? \n This provides experimental Terraform 0.12 support",
            "Install", "Abort");
        if (continueInstall === "Abort") {
            vscode.window.showErrorMessage("Terraform language server install aborted");
            return;
        }
        
        // Create dir for lsp binary if it doesn't exist
        if (! fs.existsSync(path)) {
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