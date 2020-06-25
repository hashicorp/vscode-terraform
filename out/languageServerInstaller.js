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
const crypto = require("crypto");
const fs = require("fs");
const https = require("https");
const os = require("os");
const semver = require("semver");
const yauzl = require("yauzl");
const releasesUrl = "https://releases.hashicorp.com/terraform-ls";
class LanguageServerInstaller {
    install(directory) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                let userAgent;
                let extensionVersion = '2.0.0'; // TODO set this programatically
                let vscodeVersion = vscode.version;
                userAgent = `Terraform-VSCode/${extensionVersion} VSCode/${vscodeVersion}`;
                const lspCmd = `${directory}/terraform-ls --version`;
                cp.exec(lspCmd, (err, stdout, stderr) => {
                    if (err) {
                        this.checkCurrent(userAgent).then((currentRelease) => {
                            fs.mkdirSync(directory, { recursive: true });
                            this.installPkg(directory, currentRelease, userAgent).then(() => {
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
                        this.checkCurrent(userAgent).then((currentRelease) => {
                            if (semver.gt(currentRelease.version, installedVersion, { includePrerelease: true })) {
                                const installMsg = `A new language server release is available: ${currentRelease.version}. Install now?`;
                                vscode.window.showInformationMessage(installMsg, 'Install', 'Cancel').then((selected) => {
                                    if (selected === 'Install') {
                                        fs.mkdirSync(directory, { recursive: true });
                                        this.installPkg(directory, currentRelease, userAgent).then(() => {
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
    checkCurrent(userAgent) {
        const indexUrl = `${releasesUrl}/index.json`;
        const headers = { 'User-Agent': userAgent };
        return new Promise((resolve, reject) => {
            const request = https.request(indexUrl, { headers: headers }, (response) => {
                if (response.statusCode !== 200) {
                    return reject(response.statusMessage);
                }
                let releaseData = "";
                response.on('data', (data) => {
                    releaseData += data;
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
    installPkg(installDir, release, userAgent) {
        const destination = `${installDir}/terraform-ls_v${release.version}.zip`;
        let platform = os.platform().toString();
        if (platform === 'win32') {
            platform = 'windows';
        }
        let arch = os.arch();
        switch (arch) {
            case 'x64':
                arch = 'amd64';
                break;
            case 'x32':
                arch = '386';
                break;
        }
        const build = release.builds.find(b => b.os === platform && b.arch === arch);
        const downloadUrl = build.url;
        if (!downloadUrl) {
            // No matching build found
            return Promise.reject();
        }
        try {
            this.removeOldBinary(installDir, platform);
        }
        catch (_a) {
            // ignore missing binary (new install)
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
                progress.report({ increment: 30 });
                return this.download(downloadUrl, destination, userAgent)
                    .then(() => {
                    progress.report({ increment: 30 });
                    return this.verify(release, destination, build.filename)
                        .then(() => {
                        progress.report({ increment: 30 });
                        return this.unpack(installDir, destination);
                    });
                });
            }).then(() => {
                return resolve();
            }, (err) => {
                try {
                    fs.unlinkSync(destination);
                }
                finally {
                    return reject(err);
                }
            });
        });
    }
    removeOldBinary(directory, platform) {
        if (platform === "windows") {
            fs.unlinkSync(`${directory}/terraform-ls.exe`);
        }
        else {
            fs.unlinkSync(`${directory}/terraform-ls`);
        }
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
                    return resolve();
                });
            });
            request.on('error', (error) => { return reject(error); });
            request.end();
        });
    }
    verify(release, pkg, buildName) {
        return new Promise((resolve, reject) => {
            const hash = crypto.createHash('sha256');
            const pkgStream = fs.createReadStream(pkg);
            pkgStream.on('data', (data) => {
                hash.update(data);
            });
            let shasumResponse = "";
            https.get(`${releasesUrl}/${release.version}/${release.shasums}`, (response) => {
                response.on('data', (data) => {
                    shasumResponse += data;
                });
                response.on('end', () => {
                    const shasumLine = shasumResponse.split(`\n`).find(line => line.includes(buildName));
                    if (!shasumLine) {
                        return reject(`Install error: no matching SHA sum for ${buildName}`);
                    }
                    const shasum = shasumLine.split("  ")[0];
                    if (hash.digest('hex') !== shasum) {
                        return reject(`Install error: SHA sum for ${buildName} does not match`);
                    }
                    else {
                        return resolve();
                    }
                });
            }).on('error', (err) => {
                return reject(err);
            });
        });
    }
    unpack(directory, pkgName) {
        return new Promise((resolve, reject) => {
            let executable;
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