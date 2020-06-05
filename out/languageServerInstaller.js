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
const os = require("os");
const semver = require("semver");
const yauzl = require("yauzl");
class LanguageServerInstaller {
    install(directory) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                let identifer;
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
                    }
                    else if (stderr) { // Version outputs to stderr
                        const installedVersion = stderr;
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
    checkCurrent(identifier) {
        const releasesUrl = "https://releases.hashicorp.com/terraform-ls/index.json";
        const headers = { 'User-Agent': identifier };
        return new Promise((resolve, reject) => {
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
    installPkg(installDir, release, identifer, downloadUrl) {
        if (!downloadUrl) {
            let arch = os.arch();
            let platform = os.platform().toString();
            switch (arch) {
                case 'x64':
                    arch = 'amd64';
                    break;
                case 'x32':
                    arch = '386';
                    break;
            }
            if (platform === 'win32') {
                platform = 'windows';
            }
            downloadUrl = release.builds.find(b => b.os === platform && b.arch === arch).url;
            if (!downloadUrl) {
                // No matching build found
                return Promise.reject();
            }
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
                    this.download(downloadUrl, `${installDir}/terraform-ls_v${release.version}.zip`, identifer).then((pkgName) => {
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
            let executable;
            if (fs.existsSync(`${directory}/terraform-ls`)) {
                fs.unlinkSync(`${directory}/terraform-ls`);
            }
            else if (fs.existsSync(`${directory}/terraform-ls.exe`)) {
                fs.unlinkSync(`${directory}/terraform-ls.exe`);
            }
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
exports.LanguageServerInstaller = LanguageServerInstaller;
//# sourceMappingURL=languageServerInstaller.js.map