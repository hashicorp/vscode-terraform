import { getRelease } from '@hashicorp/js-releases';
import * as path from 'path';
import * as semver from 'semver';
import * as vscode from 'vscode';
import { exec } from '../utils';
import { config } from '../vscodeUtils';

export async function lsNeedsInstall(
  binPath: string,
  stgBinPath: string,
  extensionVersion: string,
  requestedVersion = 'latest',
): Promise<boolean> {
  if (vscode.env.isNewAppInstall) {
    // vscode thinks this is a new install, we need to download ls
    return true;
  }

  try {
    // attempt to find if there is a staged ls present
    await vscode.workspace.fs.stat(vscode.Uri.file(stgBinPath));

    // stg is present, move to prod path
    await vscode.workspace.fs.rename(vscode.Uri.file(stgBinPath), vscode.Uri.file(binPath), { overwrite: true });
  } catch (error) {
    // failure to find exe means we need to download ls
    // return true;
  }

  // attempt to find is there is an ls already present
  if ((await pathExists(binPath)) === false) {
    // failure to find exe means we need to download ls
    return true;
  }

  if (config('extensions').get<boolean>('autoCheckUpdates') === false) {
    // we know a LS is present, but user does not want to check for updates
    return false;
  }

  // this should not throw, we know there is a ls present at this point
  const installedReleaseVersion = await getLsVersion(binPath);

  const requestedRelease = await getRelease(
    'terraform-ls',
    requestedVersion,
    `Terraform-VSCode/${extensionVersion} VSCode/${vscode.version}`,
  );

  if (semver.eq(requestedRelease.version, installedReleaseVersion, { includePrerelease: true })) {
    // current ls version is already at the specified version
    return false;
  } else if (semver.gt(requestedRelease.version, installedReleaseVersion, { includePrerelease: true })) {
    // upgrade: new version available
    console.log(`A new language server release is available: '${requestedRelease.version}'`);
  } else {
    // downgrade: older version available
    console.log(`An older language server release is available: '${requestedRelease.version}'`);
  }
  return config('extensions').get<boolean>('autoUpdate');
}

export async function downloadLS(
  installDir: string,
  requestedVersion: string,
  extensionVersion: string,
): Promise<void> {
  const userAgent = `Terraform-VSCode/${extensionVersion} VSCode/${vscode.version}`;
  const requested = await getRelease('terraform-ls', requestedVersion, userAgent);

  if ((await pathExists(installDir)) === false) {
    await vscode.workspace.fs.createDirectory(vscode.Uri.file(installDir));
  }

  const destination = path.resolve(installDir, `terraform-ls_v${requested.version}.zip`);

  const os = getOS();
  const arch = getArch();
  const build = requested.getBuild(os, arch);
  if (!build) {
    throw new Error(`Install error: no matching terraform-ls binary for ${os}/${arch}`);
  }

  console.log(`InstallDir: ${installDir}`);
  console.log(`Zip: ${destination}`);

  return vscode.window.withProgress(
    {
      cancellable: true,
      location: vscode.ProgressLocation.Window,
      title: 'Installing terraform-ls',
    },
    async (progress) => {
      progress.report({ increment: 30 });
      await requested.download(build.url, destination, userAgent);

      progress.report({ increment: 30 });
      await requested.verify(destination, build.filename);

      progress.report({ increment: 20 });
      await requested.unpack(installDir, destination);

      progress.report({ increment: 10 });
      // await vscode.workspace.fs.delete(vscode.Uri.file(destination));
    },
  );
}

export async function pathExists(target: string): Promise<boolean> {
  try {
    // attempt to find is there is an ls already present
    await vscode.workspace.fs.stat(vscode.Uri.file(target));
    return true;
  } catch (error) {
    return false;
  }
}

async function getLsVersion(binPath: string): Promise<string> {
  try {
    const jsonCmd: { stdout: string } = await exec(binPath, ['version', '-json']);
    const jsonOutput = JSON.parse(jsonCmd.stdout);
    return jsonOutput.version;
  } catch (err) {
    // assume older version of LS which didn't have json flag
    if (err.status != 0) {
      const plainCmd: { stdout: string; stderr: string } = await exec(binPath, ['-version']);
      return plainCmd.stdout || plainCmd.stderr;
    } else {
      throw err;
    }
  }
}

function getOS(): string {
  const platform = process.platform.toString();
  switch (platform) {
    case 'win32':
      return 'windows';
    case 'sunos':
      return 'solaris';
    default:
      return platform;
  }
}

function getArch(): string {
  const arch = process.arch;

  switch (arch) {
    case 'ia32':
      return '386';
    case 'x64':
      return 'amd64';
    default:
      return arch;
  }
}

export function isValidVersionString(value: string): boolean {
  return semver.validRange(value, { includePrerelease: true, loose: true }) !== null;
}
