import * as vscode from 'vscode';

import cp = require('child_process');
import * as fs from 'fs';
import * as https from 'https';
import { Octokit } from '@octokit/rest';
import * as os from 'os';
import * as semver from 'semver';
import * as yauzl from 'yauzl';

export class LanguageServerInstaller {
	public async install(directory: string) {
		return new Promise<void>((resolve, reject) => {
			let identifer: string;
			let extensionVersion = '2.0.0'; // TODO set this programatically
			let vscodeVersion = vscode.version;
			identifer = `Terraform-VSCode/${extensionVersion} VSCode/${vscodeVersion}`;

			const lspCmd = `${directory}/terraform-ls --version`;
			cp.exec(lspCmd, (err, stdout, stderr) => {
				if (err) {
					this.checkCurrent().then((version: string) => {
						fs.mkdirSync(directory, { recursive: true });
						this.installPkg(directory, version, identifer).then(() => {
							vscode.window.showInformationMessage(`Installed terraform-ls ${version}`);
							return resolve();
						}).catch((err) => {
							return reject(err);
						});
					}).catch((err) => {
						return reject(err);
					});
				} else if (stderr) { // Version outputs to stderr
					const installedVersion: string = stderr;
					this.checkCurrent().then((newVersion: string) => {
						if (semver.gt(newVersion, installedVersion, { includePrerelease: true })) {
							const installMsg = `A new language server release is available: ${newVersion}. Install now?`;
							vscode.window.showInformationMessage(installMsg, 'Install', 'Cancel').then((selected) => {
								if (selected === 'Install') {
									fs.mkdirSync(directory, { recursive: true });
									this.installPkg(directory, newVersion, identifer).then(() => {
										vscode.window.showInformationMessage(`Installed terraform-ls ${newVersion}`);
										console.log(`LS installed to ${directory}`);
										return resolve();
									}).catch((err) => {
										return reject(err);
									});
								} else if (selected === 'Cancel') {
									return resolve();
								}
							});
						} else {
							return resolve();
						}
					});
				} else {
					vscode.window.showErrorMessage('Unable to install terraform-ls');
					console.log(stdout);
					return reject();
				}
			})
		});
	}

	checkCurrent() {
		const octokit = new Octokit();
		return new Promise<string>((resolve, reject) => {
			octokit.repos.getLatestRelease({
				owner: 'hashicorp',
				repo: 'terraform-ls'
			})
			.then(({ data }) => {
				const newVersion = semver.clean(data.name);
				resolve(newVersion);
			})
			.catch((err) => {
				reject(err);
			});
		});
	}

	installPkg(installDir: string, version: string, identifer: string, downloadUrl?: string): Promise<void> {
		if (!downloadUrl) {
			const platform = os.platform();
			const arch = os.arch();
			let pkgName: string;

			switch (platform) {
				case 'darwin':
					pkgName = 'darwin_amd64';
					break;
				case 'linux':
					if (arch == 'x64') {
						pkgName = 'linux_amd64';
					} else if (arch == 'x32') {
						pkgName = 'linux_386';
					}
					break;
				case 'win32':
					if (arch == 'x64') {
						pkgName = 'windows_amd64';
					} else if (arch == 'x32') {
						pkgName = 'windows_386';
					}
					break;
				default: // If we're on an unexpected system or can't read this, abort
					return Promise.reject();
			}

			pkgName = `terraform-ls_${version}_${pkgName}`;
			downloadUrl = `https://github.com/hashicorp/terraform-ls/releases/download/v${version}/${pkgName}.zip`;
		}

		return new Promise<void>((resolve, reject) => {
			vscode.window.withProgress({
				cancellable: true,
				location: vscode.ProgressLocation.Notification,
				title: "Installing terraform-ls"
			}, (progress, token) => {
				token.onCancellationRequested(() => {
					return reject();
				});

				progress.report({ increment: 10 });
				return new Promise<void>((resolve, reject) => {
					this.download(downloadUrl, `${installDir}/terraform-ls_v${version}.zip`, identifer).then((pkgName) => {
						progress.report({ increment: 50 });
						return resolve(this.unpack(installDir, pkgName));
					}).catch((err) => {
						return reject(err);
					});
				});
			}).then(() => {
				return resolve();
			},
			(err) => {
				return reject(err);
			});
		});
	}

	download(downloadUrl: string, installPath: string, identifier: string) {
		const headers = { 'User-Agent': identifier };
		return new Promise<string>((resolve, reject) => {
			const request = https.request(downloadUrl, { headers: headers }, (response) => {
				if (response.statusCode === 301 || response.statusCode === 302) { // redirect for CDN
					const redirectUrl: string = response.headers.location;
					return resolve(this.download(redirectUrl, installPath, identifier));
				}
				if (response.statusCode !== 200) {
					return reject(response.statusMessage);
				}
				const pkg = fs.createWriteStream(installPath);
				response.pipe(pkg);
				response.on('end', () => {
					try {
						return resolve(installPath);
					} catch (err) {
						return reject(err);
					}
				});
			});

			request.on('error', (error) => { return reject(error); });
			request.end();
		});
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