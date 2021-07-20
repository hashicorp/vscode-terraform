import * as vscode from 'vscode';
import * as del from 'del';
import * as fs from 'fs';
import * as path from 'path';
import * as semver from 'semver';
import TelemetryReporter from 'vscode-extension-telemetry';

import { exec } from './utils';
import { Release, getRelease } from '@hashicorp/js-releases';

const extensionVersion = vscode.extensions.getExtension('hashicorp.terraform').packageJSON.version;
export const defaultVersionString = "latest";

export function isValidVersionString(value: string): boolean {
	return semver.validRange(value,  { includePrerelease: true, loose: true }) !== null;
}

export class LanguageServerInstaller {
	constructor(
		private directory: string,
		private reporter: TelemetryReporter
	) { }

	private userAgent = `Terraform-VSCode/${extensionVersion} VSCode/${vscode.version}`;
	private release: Release;

	private async getRequiredVersionRelease(versionString: string): Promise<Release> {
		try {
			const release = await getRelease("terraform-ls", versionString, this.userAgent);
			console.log(`Found Terraform language server version ${release.version} which satisfies range '${versionString}'`);
			return release;
		} catch (err) {
			if (versionString == defaultVersionString) { throw err; }
			console.log(`Error while finding Terraform language server release which satisfies range '${versionString}' and will reattempt with '${defaultVersionString}': ${err}`)
		}

		// Attempt to find the latest release
		const release = await getRelease("terraform-ls", defaultVersionString, this.userAgent);
		console.log(`Found Default Terraform language server version ${release.version} which satisfies range '${defaultVersionString}'`);
		return release;
	}

	public async needsInstall(requiredVersion: string): Promise<boolean> {
		// Silently default to latest if an invalid version string is passed.
		// Actually telling the user about a bad string is left to the main extension code instead of here
		const versionString = isValidVersionString(requiredVersion) ? requiredVersion : defaultVersionString;
		try {
			this.release = await this.getRequiredVersionRelease(versionString);
		} catch (err) {
			console.log(`Error while finding Terraform language server release which satisfies range '${versionString}': ${err}`)
			// if the releases site is inaccessible, report it and skip the install
			this.reporter.sendTelemetryException(err);
			return false;
		}

		let installedVersion: string;
		try {
			installedVersion = await getLsVersion(this.directory);
			console.log(`Currently installed Terraform language server is version '${installedVersion}`)
		} catch (err) {
			// Most of the time, getLsVersion will produce "ENOENT: no such file or directory"
			// on a fresh installation (unlike upgrade). It’s also possible that the file or directory
			// is inaccessible for some other reason, but we catch that separately.
			if (err.code !== 'ENOENT') {
				this.reporter.sendTelemetryException(err);
				throw err;
			}
			return true; // yes to new install
		}

		this.reporter.sendTelemetryEvent('foundLsInstalled', { terraformLsVersion: installedVersion });

		if (semver.eq(this.release.version, installedVersion, { includePrerelease: true })) {
			// Already at the specified versoin
			return false;
		} else if (semver.gt(this.release.version, installedVersion, { includePrerelease: true })) {
			// Upgrade
			const selected = await vscode.window.showInformationMessage(`A new language server release is available: ${this.release.version}. Install now?`, 'Install', 'Cancel');
			return (selected === "Install");
		} else {
			// Downgrade
			const selected = await vscode.window.showInformationMessage(`An older language server release is available: ${this.release.version}. Install now?`, 'Install', 'Cancel');
			return (selected === "Install");
		}
	}

	public async install(): Promise<void> {
		this.reporter.sendTelemetryEvent('installingLs', { terraformLsVersion: this.release.version });
		try {
			await this.installPkg(this.release);
		} catch (err) {
			vscode.window.showErrorMessage(`Unable to install terraform-ls: ${err.message}`);
			throw err;
		}

		this.showChangelog(this.release.version);
	}

	async installPkg(release: Release): Promise<void> {
		const installDir = this.directory;
		const destination = `${installDir}/terraform-ls_v${release.version}.zip`;
		fs.mkdirSync(installDir, { recursive: true }); // create install directory if missing

		const os = goOs();
		const arch = goArch();
		const build = release.getBuild(os, arch);
		if (!build) {
			throw new Error(`Install error: no matching terraform-ls binary for ${os}/${arch}`);
		}
		try {
			this.removeOldBinary();
		} catch {
			// ignore missing binary (new install)
		}

		return vscode.window.withProgress({
			cancellable: true,
			location: vscode.ProgressLocation.Notification,
			title: "Installing terraform-ls"
		}, async (progress) => {
			progress.report({ increment: 30 });
			await release.download(build.url, destination, this.userAgent);
			progress.report({ increment: 30 });
			await release.verify(destination, build.filename);
			progress.report({ increment: 30 });
			return release.unpack(installDir, destination);
		});
	}

	removeOldBinary(): void {
		fs.unlinkSync(lsBinPath(this.directory));
	}

	public async cleanupZips(): Promise<string[]> {
		return del(`${this.directory}/terraform-ls*.zip`, { force: true });
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
	const binPath = lsBinPath(dirPath);
	fs.accessSync(binPath, fs.constants.X_OK);

	try {
		const jsonCmd: { stdout: string } = await exec(binPath, ['version', '-json']);
		const jsonOutput = JSON.parse(jsonCmd.stdout);
		return jsonOutput.version
	} catch (err) {
		// assume older version of LS which didn't have json flag
		if (err.status != 0) {
			const plainCmd: { stdout: string, stderr: string } = await exec(binPath, ['-version']);
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

	return arch;
}

function lsBinPath(directory: string): string {
	if (goOs() === "windows") {
		return path.join(directory, 'terraform-ls.exe');
	} else {
		return path.join(directory, 'terraform-ls');
	}
}
