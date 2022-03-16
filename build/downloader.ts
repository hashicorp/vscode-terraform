import got from 'got';
import * as fs from 'fs';
import * as path from 'path';
import * as releases from '@hashicorp/js-releases';

function getPlatform(platform: string) {
  if (platform === 'win32') {
    return 'windows';
  }
  if (platform === 'sunos') {
    return 'solaris';
  }
  return platform;
}

function getArch(arch: string) {
  // platform | terraform-ls  | extension platform | vs code editor
  //    --    |           --  |         --         | --
  // macOS    | darwin_amd64  | darwin_x64         | ✅
  // macOS    | darwin_arm64  | darwin_arm64       | ✅
  // Linux    | linux_amd64   | linux_x64          | ✅
  // Linux    | linux_arm     | linux_armhf        | ✅
  // Linux    | linux_arm64   | linux_arm64        | ✅
  // Windows  | windows_386   | win32_ia32         | ✅
  // Windows  | windows_amd64 | win32_x64          | ✅
  // Windows  | windows_arm64 | win32_arm64        | ✅
  if (arch === 'ia32') {
    return '386';
  }
  if (arch === 'x64') {
    return 'amd64';
  }
  if (arch === 'armhf') {
    return 'arm';
  }
  return arch;
}

interface ExtensionInfo {
  name: string;
  extensionVersion: string;
  languageServerVersion: string;
  preview: false;
  syntaxVersion: string;
}

function getExtensionInfo(): ExtensionInfo {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const pjson = require('../package.json');
  return {
    name: pjson.name,
    extensionVersion: pjson.version,
    languageServerVersion: pjson.langServer.version,
    syntaxVersion: pjson.syntax.version,
    preview: pjson.preview,
  };
}

async function downloadLanguageServer(platform: string, architecture: string, extInfo: ExtensionInfo) {
  const cwd = path.resolve(__dirname);

  const buildDir = path.basename(cwd);
  const repoDir = cwd.replace(buildDir, '');
  const installPath = path.join(repoDir, 'bin');
  if (fs.existsSync(installPath)) {
    console.log('terraform-ls path exists. Exiting');
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

  console.log(build);

  const zipfile = path.resolve(installPath, `terraform-ls_v${release.version}.zip`);
  await release.download(build.url, zipfile, userAgent);
  await release.verify(zipfile, build.filename);
  await release.unpack(installPath, zipfile);

  fs.rmSync(zipfile, {
    recursive: true,
  });
}

async function downloadSyntax(info: ExtensionInfo) {
  const release = `v${info.syntaxVersion}`;

  const fileName = `${info.name}.tmGrammar.json`;
  const url = `https://github.com/hashicorp/syntax/releases/download/${release}/${fileName}`;
  console.log(`Downloading: ${url}`);

  const cwd = path.resolve(__dirname);
  const buildDir = path.basename(cwd);
  const repoDir = cwd.replace(buildDir, '');
  const installPath = path.join(repoDir, 'syntaxes');

  const fpath = path.join(installPath, fileName);
  if (fs.existsSync(installPath)) {
    fs.rmSync(installPath, { recursive: true, force: true });
  }
  fs.mkdirSync(installPath);

  const content = await got({ url }).text();
  fs.writeFileSync(fpath, content);
  console.log(`Download completed: ${fpath}`);
}

async function run(platform: string, architecture: string) {
  const extInfo = getExtensionInfo();
  console.log(extInfo);
  await downloadLanguageServer(platform, architecture, extInfo);
  await downloadSyntax(extInfo);
}

let os = process.platform.toString();
let arch = process.arch;

// ls_target=linux_amd64 npm run package -- --target=linux-x64
const lsTarget = process.env.ls_target;
if (lsTarget !== undefined) {
  const tgt = lsTarget.split('_');
  os = tgt[0];
  arch = tgt[1];
}

// npm run download:ls --target=darwin-x64
const target = process.env.npm_config_target;
if (target !== undefined) {
  const tgt = target.split('-');
  os = tgt[0];
  arch = tgt[1];
}

run(os, arch);
