import * as vscode from "vscode";
import { Command, CommandType } from "./command";
import * as fs from 'fs';
import * as Path from 'path';
import * as tar from 'tar';
import * as Octokit from '@octokit/rest';
import { HttpClient } from 'typed-rest-client/HttpClient';
import { QuickPickItem } from "vscode";
import { getConfiguration } from "../configuration";
import { ExperimentalLanguageClient } from "../languageclient";

export class InstallLanguageServerCommand extends Command {
  public static readonly CommandName = "installLanguageServer";

  constructor(ctx: vscode.ExtensionContext) {
    super(InstallLanguageServerCommand.CommandName, ctx, CommandType.PALETTE);
  }

  protected async perform(releaseId: string = null): Promise<void> {
    ExperimentalLanguageClient.stopIfRunning();

    const serverLocation = getConfiguration().languageServer.pathToBinary || Path.join(this.ctx.extensionPath, "lspbin");

    // Create dir for lsp binary if it doesn't exist
    if (!fs.existsSync(serverLocation)) {
      fs.mkdirSync(serverLocation);
    }
    const downloadedZipFile = Path.join(serverLocation, 'terraform-lsp.tar.gz');
    // Download language server
    const octokit = new Octokit();

    // What releases are available?
    const availableReleses = await octokit.repos.listReleases({
      owner: 'juliosueiras',
      repo: 'terraform-lsp'
    })

    if (!releaseId) {
      let releaseOptions = [];
      availableReleses.data.forEach(r => {
        releaseOptions.push({
          label: r.name,
          description: `Is Prerelease version?: ${r.prerelease} Tag: ${r.tag_name}`,
          detail: r.id.toString()
        } as QuickPickItem);
      });

      let choice = await vscode.window.showQuickPick(releaseOptions, { placeHolder: "Terraform language server install - please pick a version" })
      if (choice === undefined) {
        vscode.window.showErrorMessage("You must pick a version to complete installation");
        return;
      }

      releaseId = choice.detail;
    }

    const release = await octokit.repos.getRelease({
      owner: 'juliosueiras',
      repo: 'terraform-lsp',
      release_id: Number.parseFloat(releaseId)
    })

    // The github releases refer to `windows` not `win32` so
    // change the platform string if we're on `win32`
    let platform = process.platform.toString();
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
              cwd: serverLocation,
              onwarn: (message, data) => {
                console.log(message);
              }
            })
          )
          unzipStream.on("finish", () => {
            // ExperimentalLanguageClient.reloadWindow();
            resolve();
          });
        } catch (err) {
          vscode.window.showErrorMessage(`Unzipping Terraform language server failed with ${err}`);
          reject(err);
        }
      });
    });
  }
}