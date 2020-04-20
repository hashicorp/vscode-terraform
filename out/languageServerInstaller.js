"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const cp = require("child_process");
const fs = require("fs");
const https = require("https");
const rest_1 = require("@octokit/rest");
const os = require("os");
const semver = require("semver");
const yauzl = require("yauzl");
class LanguageServerInstaller {
    install(directory) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                let identifer;
                let extensionVersion = '2.0.0'; // TODO set this programatically
                let tfVersion;
                let vscodeVersion = vscode.version;
                try {
                    const checkTfVersion = cp.execSync('terraformy -v');
                    tfVersion = semver.coerce(checkTfVersion.toString()).toString();
                }
                catch (err) {
                    tfVersion = 'x.x.x'; // TODO better placeholder?
                }
                identifer = `Terraform-VSCode/${extensionVersion} Terraform/${tfVersion} VSCode/${vscodeVersion}`;
                const lspCmd = `${directory}/terraform-ls --version`;
                cp.exec(lspCmd, (err, stdout, stderr) => {
                    if (err) {
                        this.checkCurrent().then((version) => {
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
                    }
                    else if (stderr) { // Version outputs to stderr
                        const installedVersion = stderr;
                        this.checkCurrent().then((newVersion) => {
                            if (semver.gt(newVersion, installedVersion, { includePrerelease: true })) {
                                const installMsg = `A new language server release is available: ${newVersion}. Install now?`;
                                vscode.window.showInformationMessage(installMsg, 'Install', 'Cancel').then((selected) => {
                                    if (selected === 'Install') {
                                        fs.mkdirSync(directory, { recursive: true });
                                        this.installPkg(directory, newVersion, identifer).then(() => {
                                            vscode.window.showInformationMessage(`Installed terraform-ls ${newVersion}`);
                                            return resolve();
                                        }).catch((err) => {
                                            return reject(err);
                                        });
                                    }
                                    else if (selected === 'Cancel') {
                                        return resolve();
                                    }
                                });
                            }
                            else {
                                return resolve();
                            }
                        });
                    }
                    else {
                        vscode.window.showErrorMessage('Unable to install terraform-ls');
                        console.log(stdout);
                        return reject();
                    }
                });
            });
        });
    }
    checkCurrent() {
        const octokit = new rest_1.Octokit();
        return new Promise((resolve, reject) => {
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
    installPkg(installDir, version, identifer, downloadUrl) {
        if (!downloadUrl) {
            const platform = os.platform();
            const arch = os.arch();
            let pkgName;
            switch (platform) {
                case 'darwin':
                    pkgName = 'darwin_amd64';
                    break;
                case 'linux':
                    if (arch == 'x64') {
                        pkgName = 'linux_amd64';
                    }
                    else if (arch == 'x32') {
                        pkgName = 'linux_386';
                    }
                    break;
                case 'win32':
                    if (arch == 'x64') {
                        pkgName = 'windows_amd64';
                    }
                    else if (arch == 'x32') {
                        pkgName = 'windows_386';
                    }
                    break;
                default: // If we're on an unexpected system or can't read this, abort
                    return Promise.reject();
            }
            pkgName = `terraform-ls_${version}_${pkgName}`;
            downloadUrl = `https://github.com/hashicorp/terraform-ls/releases/download/v${version}/${pkgName}.zip`;
        }
        return new Promise((resolve, reject) => {
            vscode.window.withProgress({
                cancellable: true,
                location: vscode.ProgressLocation.Notification,
                title: "Installing terraform-ls"
            }, (progress, token) => {
                token.onCancellationRequested(() => {
                    return reject();
                });
                progress.report({ increment: 10 });
                return new Promise((resolve, reject) => {
                    this.download(downloadUrl, `${installDir}/terraform-ls_v${version}.zip`, identifer).then((pkgName) => {
                        progress.report({ increment: 50 });
                        return resolve(this.unpack(installDir, pkgName));
                    }).catch((err) => {
                        return reject(err);
                    });
                });
            }).then(() => {
                return resolve();
            }, (err) => {
                return reject(err);
            });
        });
    }
    download(downloadUrl, installPath, identifier) {
        const headers = { 'User-Agent': identifier };
        return new Promise((resolve, reject) => {
            const request = https.request(downloadUrl, { headers: headers }, (response) => {
                if (response.statusCode === 301 || response.statusCode === 302) { // redirect for CDN
                    const redirectUrl = response.headers.location;
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
                    }
                    catch (err) {
                        return reject(err);
                    }
                });
            });
            request.on('error', (error) => { return reject(error); });
            request.end();
        });
    }
    unpack(directory, pkgName) {
        return new Promise((resolve, reject) => {
            const fileName = `${directory}/terraform-ls`;
            const binFile = fs.createWriteStream(fileName);
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
                        readStream.pipe(binFile);
                    });
                });
                zipfile.on('close', () => {
                    return resolve();
                });
            });
            binFile.on('close', () => {
                fs.chmodSync(fileName, '755');
            });
        });
    }
}
exports.LanguageServerInstaller = LanguageServerInstaller;
//# sourceMappingURL=languageServerInstaller.js.map