/**
 * Copyright (c) HashiCorp, Inc.
 * SPDX-License-Identifier: MPL-2.0
 */

import * as releases from '@hashicorp/js-releases';
import axios from 'axios';
import { Buffer } from 'buffer';
import * as fs from 'fs';
import console from 'node:console';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function fileFromUrl(url) {
  const response = await axios.get(url, { responseType: 'arraybuffer' });
  return Buffer.from(response.data, 'binary');
}

function getPlatform(platform) {
  if (platform === 'win32') {
    return 'windows';
  }
  if (platform === 'sunos') {
    return 'solaris';
  }
  return platform;
}

function getArch(arch) {
  // platform | terraform-ls  | extension platform | vs code editor
  //    --    |           --  |         --         | --
  // macOS    | darwin_amd64  | darwin_x64         | ✅
  // macOS    | darwin_arm64  | darwin_arm64       | ✅
  // Linux    | linux_amd64   | linux_x64          | ✅
  // Linux    | linux_arm     | linux_armhf        | ✅
  // Linux    | linux_arm64   | linux_arm64        | ✅
  // Windows  | windows_amd64 | win32_x64          | ✅
  // Windows  | windows_arm64 | win32_arm64        | ✅
  if (arch === 'x64') {
    return 'amd64';
  }
  if (arch === 'armhf') {
    return 'arm';
  }
  return arch;
}

function getExtensionInfo() {
  const cwd = path.resolve(__dirname);
  const buildDir = path.basename(cwd);
  const repoDir = cwd.replace(buildDir, '');
  const pjson = JSON.parse(fs.readFileSync(path.join(repoDir, 'package.json')));
  return {
    name: pjson.name,
    extensionVersion: pjson.version,
    languageServerVersion: pjson.langServer.version,
    syntaxVersion: pjson.syntax.version,
    preview: pjson.preview,
  };
}

async function downloadLanguageServer(platform, architecture, extInfo) {
  const cwd = path.resolve(__dirname);

  const buildDir = path.basename(cwd);
  const repoDir = cwd.replace(buildDir, '');
  const installPath = path.join(repoDir, 'bin');
  const filename = process.platform === 'win32' ? 'terraform-ls.exe' : 'terraform-ls';
  const filePath = path.join(installPath, filename);
  if (fs.existsSync(filePath)) {
    if (process.env.downloader_log === 'true') {
      console.log(`Terraform LS exists at ${filePath}. Exiting`);
    }
    return;
  }

  fs.mkdirSync(installPath);

  // userAgent = `Terraform-VSCode/${extensionVersion} VSCode/${vscodeVersion}`;
  const ciBuild = process.env.CI;
  const runnerLocation = ciBuild ? `CLI-Downloader GitHub-Actions` : `CLI-Downloader`;
  const userAgent = `Terraform-VSCode/${extInfo.extensionVersion} ${runnerLocation} (${platform}; ${architecture})`;

  const release = await releases.getRelease('terraform-ls', extInfo.languageServerVersion, userAgent, extInfo.preview);

  const os = getPlatform(platform);
  const arch = getArch(architecture);

  const build = release.getBuild(os, arch);
  if (!build) {
    throw new Error(`Install error: no matching terraform-ls binary for  ${os}/${arch}`);
  }

  if (process.env.downloader_log === 'true') {
    console.log(build);
  }

  const zipfile = path.resolve(installPath, `terraform-ls_v${release.version}.zip`);
  await release.download(build.url, zipfile, userAgent);
  await release.verify(zipfile, build.filename);
  await release.unpack(installPath, zipfile);

  fs.rmSync(zipfile, {
    recursive: true,
  });
}

async function downloadFile(url, installPath) {
  if (process.env.downloader_log === 'true') {
    console.log(`Downloading: ${url}`);
  }

  const buffer = await fileFromUrl(url);
  fs.writeFileSync(installPath, buffer);
  if (process.env.downloader_log === 'true') {
    console.log(`Download completed: ${installPath}`);
  }
}

async function downloadSyntax(info) {
  const release = `v${info.syntaxVersion}`;

  const cwd = path.resolve(__dirname);
  const buildDir = path.basename(cwd);
  const repoDir = cwd.replace(buildDir, '');
  const installPath = path.join(repoDir, 'syntaxes');

  if (fs.existsSync(installPath)) {
    if (process.env.downloader_log === 'true') {
      console.log(`Syntax path exists at ${installPath}. Removing`);
    }
    fs.rmSync(installPath, { recursive: true });
  }

  fs.mkdirSync(installPath);

  const productName = info.name.replace('-preview', '');
  const terraformSyntaxFile = `${productName}.tmGrammar.json`;
  const hclSyntaxFile = `hcl.tmGrammar.json`;

  let url = `https://github.com/hashicorp/syntax/releases/download/${release}/${terraformSyntaxFile}`;
  await downloadFile(url, path.join(installPath, terraformSyntaxFile));

  url = `https://github.com/hashicorp/syntax/releases/download/${release}/${hclSyntaxFile}`;
  await downloadFile(url, path.join(installPath, hclSyntaxFile));
}

async function run(platform, architecture) {
  const extInfo = getExtensionInfo();
  if (process.env.downloader_log === 'true') {
    console.log(extInfo);
  }

  await downloadSyntax(extInfo);

  // we don't download ls for web platforms
  if (os === 'web') {
    return;
  }

  await downloadLanguageServer(platform, architecture, extInfo);
}

let os = process.platform.toString();
let arch = process.arch;

// ls_target=linux_amd64 npm install
//  or
// ls_target=web_noop npm run download:artifacts
const lsTarget = process.env.ls_target;
if (lsTarget !== undefined) {
  const tgt = lsTarget.split('_');
  os = tgt[0];

  arch = tgt[1];
}

run(os, arch);
