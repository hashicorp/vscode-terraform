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
            const { version: extensionVersion } = require('../package.json');
            const lspCmd = `${directory}/terraform-ls --version`;
            const userAgent = `Terraform-VSCode/${extensionVersion} VSCode/${vscode.version}`;
            let isInstalled = true;
            try {
                var { stdout, stderr: installedVersion } = yield exec(lspCmd);
            }
            catch (err) {
                // TODO: verify error was in fact binary not found
                isInstalled = false;
            }
            const currentRelease = yield checkLatest(userAgent);
            if (isInstalled) {
                if (semver.gt(currentRelease.version, installedVersion, { includePrerelease: true })) {
                    const selected = yield vscode.window.showInformationMessage(`A new language server release is available: ${currentRelease.version}. Install now?`, 'Install', 'Cancel');
                    if (selected === 'Cancel') {
                        return;
                    }
                }
                else {
                    return;
                }
            }
            try {
                yield this.installPkg(directory, currentRelease, userAgent);
            }
            catch (err) {
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
            });
        });
    }
    installPkg(installDir, release, userAgent) {
        return __awaiter(this, void 0, void 0, function* () {
            const destination = `${installDir}/terraform-ls_v${release.version}.zip`;
            fs.mkdirSync(installDir, { recursive: true }); // create install directory if missing
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
                throw new Error("Install error: no matching terraform-ls binary for platform");
            }
            try {
                this.removeOldBinary(installDir, platform);
            }
            catch (_a) {
                // ignore missing binary (new install)
            }
            return vscode.window.withProgress({
                cancellable: true,
                location: vscode.ProgressLocation.Notification,
                title: "Installing terraform-ls"
            }, (progress, token) => __awaiter(this, void 0, void 0, function* () {
                progress.report({ increment: 30 });
                yield this.download(downloadUrl, destination, userAgent);
                progress.report({ increment: 30 });
                yield this.verify(release, destination, build.filename);
                progress.report({ increment: 30 });
                return this.unpack(installDir, destination);
            }));
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
            https.request(downloadUrl, { headers: headers }, (response) => {
                if (response.statusCode === 301 || response.statusCode === 302) { // redirect for CDN
                    const redirectUrl = response.headers.location;
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
    verify(release, pkg, buildName) {
        return __awaiter(this, void 0, void 0, function* () {
            const values = yield Promise.all([
                this.calculateFileSha256Sum(pkg),
                this.downloadSha256Sum(release, buildName)
            ]);
            const [localSum, remoteSum] = values;
            if (remoteSum !== localSum) {
                throw new Error(`Install error: SHA sum for ${buildName} does not match.\n` +
                    `(expected: ${remoteSum} calculated: ${localSum})`);
            }
        });
    }
    calculateFileSha256Sum(path) {
        return new Promise((resolve, reject) => {
            const hash = crypto.createHash('sha256');
            fs.createReadStream(path)
                .on('error', reject)
                .on('data', data => hash.update(data))
                .on('end', () => resolve(hash.digest('hex')));
        });
    }
    downloadSha256Sum(release, buildName) {
        return __awaiter(this, void 0, void 0, function* () {
            const shasumResponse = yield httpsRequest(`${releasesUrl}/${release.version}/${release.shasums}`);
            const shasumLine = shasumResponse.split(`\n`).find(line => line.includes(buildName));
            if (!shasumLine) {
                throw new Error(`Install error: no matching SHA sum for ${buildName}`);
            }
            return shasumLine.split("  ")[0];
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
function exec(cmd) {
    return new Promise((resolve, reject) => {
        cp.exec(cmd, (err, stdout, stderr) => {
            if (err) {
                return reject(err);
            }
            return resolve({ stdout, stderr });
        });
    });
}
function httpsRequest(url, options = {}) {
    return new Promise((resolve, reject) => {
        https.request(url, options, res => {
            if (res.statusCode === 301 || res.statusCode === 302) { // follow redirects
                const redirectUrl = res.headers.location;
                return resolve(httpsRequest(redirectUrl, options));
            }
            if (res.statusCode !== 200) {
                return reject(res.statusMessage);
            }
            let body = '';
            res.on('data', data => {
                body += data;
            })
                .on('end', () => resolve(body));
        })
            .on('error', reject)
            .end();
    });
}
function checkLatest(userAgent) {
    return __awaiter(this, void 0, void 0, function* () {
        const indexUrl = `${releasesUrl}/index.json`;
        const headers = { 'User-Agent': userAgent };
        const body = yield httpsRequest(indexUrl, { headers });
        let releases = JSON.parse(body);
        const currentRelease = Object.keys(releases.versions).sort(semver.rcompare)[0];
        return releases.versions[currentRelease];
    });
}
//# sourceMappingURL=languageServerInstaller.js.map