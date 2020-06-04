import * as vscode from 'vscode';

import cp = require('child_process');
import * as fs from 'fs';
import * as https from 'https';
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
					this.checkCurrent(identifer).then((currentRelease) => {
						fs.mkdirSync(directory, { recursive: true });
						this.installPkg(directory, currentRelease, identifer).then(() => {
							vscode.window.showInformationMessage(`Installed terraform-ls ${currentRelease.version}`);
							return resolve();
						}).catch((err) => {
							return reject(err);
						});
					}).catch((err) => {
						return reject(err);
					});
				} else if (stderr) { // Version outputs to stderr
					const installedVersion: string = stderr;
					this.checkCurrent(identifer).then((currentRelease) => {
						if (semver.gt(currentRelease.version, installedVersion, { includePrerelease: true })) {
							const installMsg = `A new language server release is available: ${currentRelease.version}. Install now?`;
							vscode.window.showInformationMessage(installMsg, 'Install', 'Cancel').then((selected) => {
								if (selected === 'Install') {
									fs.mkdirSync(directory, { recursive: true });
									this.installPkg(directory, currentRelease, identifer).then(() => {
										vscode.window.showInformationMessage(`Installed terraform-ls ${currentRelease.version}`);
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

	checkCurrent(identifier: string) {
		const releasesUrl = "https://releases.hashicorp.com/terraform-ls/index.json";
		const headers = { 'User-Agent': identifier };
		return new Promise<any>((resolve, reject) => {
			const request = https.request(releasesUrl, { headers: headers }, (response) => {
				if (response.statusCode !== 200) {
					return reject(response.statusMessage);
				}

				let releaseData = "";
				response.on('data', (chunk) => {
					releaseData += chunk;
				});
				response.on('end', () => {
					try {
						const releases = JSON.parse(releaseData).versions;
						const currentRelease = Object.keys(releases).sort(semver.rcompare)[0];
						return resolve(releases[currentRelease]);	
					} catch (err) {
						return reject(err);
					}
				});
			});

			request.on('error', (error) => { return reject(error); });
			request.end();
		});
	}

	installPkg(installDir: string, release, identifer: string, downloadUrl?: string): Promise<void> {
		if (!downloadUrl) {
			let arch = os.arch();
			let platform = os.platform().toString();

			switch (arch) {
				case 'x64':
					arch = 'amd64'
					break;
				case 'x32':
					arch = '386'
					break;
			}
			if (platform === 'win32') {
				platform = 'windows'
			}
			downloadUrl = release.builds.find(b => b.os === platform && b.arch === arch).url;
			if (!downloadUrl) {
				// No matching build found
				return Promise.reject();
			}
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
					this.download(downloadUrl, `${installDir}/terraform-ls_v${release.version}.zip`, identifer).then((pkgName) => {
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