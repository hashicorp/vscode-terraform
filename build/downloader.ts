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
  if (arch === 'ia32') {
    return '386';
  }
  if (arch === 'x64') {
    return 'amd64';
  }
  return arch;
}

interface ExtensionInfo {
  extensionVersion: string;
  languageServerVersion: string;
}

function getExtensionInfo(): ExtensionInfo {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const pjson = require('../package.json');
  return {
    extensionVersion: pjson.version,
    languageServerVersion: pjson.langServer.version,
  };
}

async function run(platform: string, architecture: string) {
  const cwd = path.resolve(__dirname);

  const buildDir = path.basename(cwd);
  const repoDir = cwd.replace(buildDir, '');
  const installPath = path.join(repoDir, 'bin');
  if (fs.existsSync(installPath)) {
    console.log('terraform-ls path exists. Exiting');
    return;
  }

  fs.mkdirSync(installPath);

  const extInfo = getExtensionInfo();
  console.log(extInfo);

  const userAgent = `Terraform-VSCode/${extInfo.extensionVersion}`;
  const release = await releases.getRelease('terraform-ls', extInfo.languageServerVersion, userAgent);

  const os = getPlatform(platform);
  const arch = getArch(architecture);

  const build = release.getBuild(os, arch);
  if (!build) {
    throw new Error(`Install error: no matching terraform-ls binary for ${os}/${arch}`);
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

let os = process.platform.toString();
let arch = process.arch;

// ls_target=linux-x64 npm run package -- --target=linux-x64
const lsTarget = process.env.target;
if (lsTarget !== undefined) {
  const tgt = lsTarget.split('-');
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
