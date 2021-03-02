import * as vscode from 'vscode';
import * as del from 'del';
import * as fs from 'fs';
import * as semver from 'semver';

import { exec } from './utils';
import { Release, getRelease } from '@hashicorp/js-releases';

export class LanguageServerInstaller {
	public async install(directory: string): Promise<void> {
		const extensionVersion = vscode.extensions.getExtension('hashicorp.terraform').packageJSON.version;
		const userAgent = `Terraform-VSCode/${extensionVersion} VSCode/${vscode.version}`;
		let isInstalled = false;
		let installedVersion: string;
		try {
			installedVersion = await getLsVersion(directory);
			isInstalled = true;
		} catch (err) {
			// TODO: verify error was in fact binary not found
			isInstalled = false;
		}

		const currentRelease = await getRelease("terraform-ls", "latest", userAgent);
		if (isInstalled) {
			if (semver.gt(currentRelease.version, installedVersion, { includePrerelease: true })) {
				const selected = await vscode.window.showInformationMessage(`A new language server release is available: ${currentRelease.version}. Install now?`, 'Install', 'Cancel');
				if (selected !== 'Install') { // selected is undefined if the user closes the message
					return;
				}
			} else {
				return;
			}
		}

		try {
			await this.installPkg(currentRelease, directory, userAgent);
		} catch (err) {
			vscode.window.showErrorMessage('Unable to install terraform-ls');
			throw err;
		}

		this.showChangelog(currentRelease.version);
	}

	async installPkg(release: Release, installDir: string, userAgent: string): Promise<void> {
		const destination = `${installDir}/terraform-ls_v${release.version}.zip`;
		fs.mkdirSync(installDir, { recursive: true }); // create install directory if missing
	
		const os = goOs();
		const arch = goArch();
		const build = release.getBuild(os, arch);
		if (!build) {
			throw new Error(`Install error: no matching terraform-ls binary for ${os}/${arch}`);
		}
		try {
			this.removeOldBinary(installDir, os);
		} catch {
			// ignore missing binary (new install)
		}
	
		return vscode.window.withProgress({
			cancellable: true,
			location: vscode.ProgressLocation.Notification,
			title: "Installing terraform-ls"
		}, async (progress) => {
			progress.report({ increment: 30 });
			await release.download(build.url, destination, userAgent);
			progress.report({ increment: 30 });
			await release.verify(destination, build.filename)
			progress.report({ increment: 30 });
			return release.unpack(installDir, destination)
		});
	}

	removeOldBinary(directory: string, goOs: string): void {
		if (goOs === "windows") {
			fs.unlinkSync(`${directory}/terraform-ls.exe`);
		} else {
			fs.unlinkSync(`${directory}/terraform-ls`);
		}
	}

	public async cleanupZips(directory: string): Promise<string[]> {
		return del(`${directory}/terraform-ls*.zip`, { force: true });
	}

	showChangelog(version: string): void {
		vscode.window.showInformationMessage(`Installed terraform-ls ${version}.`, "View Changelog")
			.then(selected => {
				if (selected === "View Changelog") {
					vscode.env.openExternal(vscode.Uri.parse(`https://github.com/hashicorp/terraform-ls/releases/tag/v${version}`));
				}
			});
		return;
	}
}

async function getLsVersion(dirPath: string): Promise<string> {
	const lsBinPath = `${dirPath}/terraform-ls`;

	fs.accessSync(lsBinPath, fs.constants.X_OK);

	try {
		const jsonCmd: { stdout: string } = await exec(`${lsBinPath} version -json`);
		const jsonOutput = JSON.parse(jsonCmd.stdout);
		return jsonOutput.version
	} catch (err) {
		// assume older version of LS which didn't have json flag
		if (err.status != 0) {
			const plainCmd: { stdout: string, stderr: string } = await exec(`${lsBinPath} -version`);
			return plainCmd.stdout || plainCmd.stderr;
		} else {
			throw err
		}
	}
}

function goOs(): string {
	const platform = process.platform.toString();
	if (platform === 'win32') {
		return 'windows';
	}
	if (platform === 'sunos') {
		return 'solaris';
	}
	return platform;
}

function goArch(): string {
	const arch = process.arch;

	if (arch === 'ia32') {
		return '386';
	}
	if (arch === 'x64') {
		return 'amd64';
	}
	if (arch === 'arm64' && process.platform.toString() === 'darwin') {
		// On Apple Silicon, install the amd64 version and rely on Rosetta2
		// until a native build is available.
		return 'amd64';
	}
	return arch;
}
