import * as vscode from 'vscode';

import cp = require('child_process');
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as https from 'https';
import * as os from 'os';
import * as semver from 'semver';
import * as yauzl from 'yauzl';

const releasesUrl = "https://releases.hashicorp.com/terraform-ls";

interface Release {
	builds?: any[];
	version: any;
	shasums?: any;
	shasums_signature?: any;
}

export class LanguageServerInstaller {
	public async install(directory: string) {
		const extensionVersion = '2.1.2'; // TODO set this programatically
		const lspCmd = `${directory}/terraform-ls --version`;
		const userAgent = `Terraform-VSCode/${extensionVersion} VSCode/${vscode.version}`;
		let isInstalled = true;
		try {
			var { stdout, stderr: installedVersion } = await exec(lspCmd);
		} catch (err) {
			// TODO: verify error was in fact binary not found
			isInstalled = false;
		}
		const currentRelease = await checkLatest(userAgent);
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
			await this.installPkg(directory, currentRelease, userAgent);
		} catch (err) {
			vscode.window.showErrorMessage('Unable to install terraform-ls');
			console.log(stdout);
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

	async installPkg(installDir: string, release: Release, userAgent: string): Promise<void> {
		const destination: string = `${installDir}/terraform-ls_v${release.version}.zip`;
		fs.mkdirSync(installDir, { recursive: true }); // create install directory if missing

		let platform = os.platform().toString();
		if (platform === 'win32') {
			platform = 'windows';
		}
		let arch = os.arch();
		switch (arch) {
			case 'x64':
				arch = 'amd64'
				break;
			case 'x32':
				arch = '386'
				break;
		}

		const build = release.builds.find(b => b.os === platform && b.arch === arch);
		const downloadUrl = build.url;
		if (!downloadUrl) {
			throw new Error("Install error: no matching terraform-ls binary for platform");
		}
		try {
			this.removeOldBinary(installDir, platform);
		} catch {
			// ignore missing binary (new install)
		}

		return vscode.window.withProgress({
			cancellable: true,
			location: vscode.ProgressLocation.Notification,
			title: "Installing terraform-ls"
		}, async (progress, token) => {

			progress.report({ increment: 30 });
			await this.download(downloadUrl, destination, userAgent);
			progress.report({ increment: 30 });
			await this.verify(release, destination, build.filename)
			progress.report({ increment: 30 });
			return this.unpack(installDir, destination)
		});
	}

	removeOldBinary(directory: string, platform: string) {
		if (platform === "windows") {
			fs.unlinkSync(`${directory}/terraform-ls.exe`);
		} else {
			fs.unlinkSync(`${directory}/terraform-ls`);
		}
	}

	download(downloadUrl: string, installPath: string, identifier: string): Promise<void> {
		const headers = { 'User-Agent': identifier };
		return new Promise<void>((resolve, reject) => {
			https.request(downloadUrl, { headers: headers }, (response) => {
				if (response.statusCode === 301 || response.statusCode === 302) { // redirect for CDN
					const redirectUrl: string = response.headers.location;
					return resolve(this.download(redirectUrl, installPath, identifier));
				}
				if (response.statusCode !== 200) {
					return reject(response.statusMessage);
				}
				response
					.on('error', reject)
					.on('end', resolve)
					.pipe(fs.createWriteStream(installPath))
					.on('error', reject);
			})
				.on('error', reject)
				.end();
		});
	}

	async verify(release: Release, pkg: string, buildName: string) {
		const values = await Promise.all([
			this.calculateFileSha256Sum(pkg),
			this.downloadSha256Sum(release, buildName)
		]);
		const [localSum, remoteSum] = values;
		if (remoteSum !== localSum) {
			throw new Error(`Install error: SHA sum for ${buildName} does not match.\n` +
				`(expected: ${remoteSum} calculated: ${localSum})`);
		}
	}

	calculateFileSha256Sum(path: string) {
		return new Promise<string>((resolve, reject) => {
			const hash = crypto.createHash('sha256');
			fs.createReadStream(path)
				.on('error', reject)
				.on('data', data => hash.update(data))
				.on('end', () => resolve(hash.digest('hex')));
		});
	}

	async downloadSha256Sum(release: Release, buildName: string) {
		const shasumResponse = await httpsRequest(`${releasesUrl}/${release.version}/${release.shasums}`);
		const shasumLine = shasumResponse.split(`\n`).find(line => line.includes(buildName));
		if (!shasumLine) {
			throw new Error(`Install error: no matching SHA sum for ${buildName}`);
		}
		return shasumLine.split("  ")[0];
	}

	unpack(directory: string, pkgName: string) {
		return new Promise<void>((resolve, reject) => {
			let executable: string;
			yauzl.open(pkgName, { lazyEntries: true }, (err, zipfile) => {
				if (err) {
					return reject(err);
				}
				zipfile.readEntry();
				zipfile.on('entry', (entry) => {
					zipfile.openReadStream(entry, (err, readStream) => {
						if (err) {
							return reject(err);
						}
						readStream.on('end', () => {
							zipfile.readEntry(); // Close it
						});

						executable = `${directory}/${entry.fileName}`;
						const destination = fs.createWriteStream(executable);
						readStream.pipe(destination);
					});
				});
				zipfile.on('close', () => {
					fs.chmodSync(executable, '755');
					return resolve();
				});
			});
		});
	}
}

function exec(cmd: string): Promise<any> {
	return new Promise((resolve, reject) => {
		cp.exec(cmd, (err, stdout, stderr) => {
			if (err) {
				return reject(err);
			}
			return resolve({ stdout, stderr });
		});
	});
}

function httpsRequest(url: string, options: https.RequestOptions = {}): Promise<string> {
	return new Promise((resolve, reject) => {
		https.request(url, options, res => {
			if (res.statusCode === 301 || res.statusCode === 302) { // follow redirects
				const redirectUrl: string = res.headers.location;
				return resolve(httpsRequest(redirectUrl, options));
			}
			if (res.statusCode !== 200) {
				return reject(res.statusMessage);
			}
			let body = '';
			res.on('data', data => {
				body += data
			})
				.on('end', () => resolve(body));
		})
			.on('error', reject)
			.end();
	});
}

async function checkLatest(userAgent: string): Promise<Release> {
	const indexUrl = `${releasesUrl}/index.json`;
	const headers = { 'User-Agent': userAgent };
	const body = await httpsRequest(indexUrl, { headers });
	let releases = JSON.parse(body);
	const currentRelease = Object.keys(releases.versions).sort(semver.rcompare)[0];
	return releases.versions[currentRelease];
}