import * as vscode from 'vscode';
import * as del from 'del';
import * as fs from 'fs';
import * as semver from 'semver';

import { exec } from './utils';
import { Release, getRelease } from '@hashicorp/js-releases';

export class LanguageServerInstaller {
	public async install(directory: string): Promise<void> {
		const extensionVersion = vscode.extensions.getExtension('hashicorp.terraform').packageJSON.version;
		const lsVersionCmd = `${directory}/terraform-ls --version`;
		const userAgent = `Terraform-VSCode/${extensionVersion} VSCode/${vscode.version}`;
		let isInstalled = false;
		let installedVersion: string;
		try {
			installedVersion = await getLsVersion(directory);
			console.log(`Found installed LS ${installedVersion}`);
			isInstalled = true
		} catch (err) {
			console.log(`failed to get version: ${err}`);
		}

		const currentRelease = await getRelease("terraform-ls", "latest", userAgent);
		if (isInstalled) {
			if (semver.gt(currentRelease.version, installedVersion, { includePrerelease: true })) {
				const selected = await vscode.window.showInformationMessage(`A new language server release is available: ${currentRelease.version}. Install now?`, 'Install', 'Cancel');
				if (selected === 'Cancel') {
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

		// Do not wait on the showInformationMessage
		vscode.window.showInformationMessage(`Installed terraform-ls ${currentRelease.version}.`, "View Changelog")
			.then(selected => {
				if (selected === "View Changelog") {
					return vscode.env.openExternal(vscode.Uri.parse(`https://github.com/hashicorp/terraform-ls/releases/tag/v${currentRelease.version}`));
				}
			})
	}

	async installPkg(release: Release, installDir: string, userAgent: string): Promise<void> {
		const destination = `${installDir}/terraform-ls_v${release.version}.zip`;
		fs.mkdirSync(installDir, { recursive: true }); // create install directory if missing
	
		let os = goOs();
		let arch = goArch();
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
}

async function getLsVersion(dirPath: string): Promise<string> {
	const lsBinPath = `${dirPath}/terraform-ls`;

	fs.accessSync(lsBinPath, fs.constants.X_OK);

	try {
		var { stdout } = await exec(`${lsBinPath} version -json`);
		let jsonOutput = JSON.parse(stdout);
		return jsonOutput.version
	} catch (err) {
		// assume older version of LS which didn't have json flag
		if (err.status != 0) {
			try {
				var { stdout, stderr } = await exec(`${lsBinPath} -version`);
				let version = stdout || stderr
				return version
			} catch (err) {
				throw err
			}
		} else {
			throw err
		}
	}
}

function goOs(): string {
	let platform = process.platform.toString();
	if (platform === 'win32') {
		return 'windows';
	}
	if (platform === 'sunos') {
		return 'solaris';
	}
	return platform;
}

function goArch(): string {
	let arch = process.arch;

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
