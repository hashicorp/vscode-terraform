import { getRelease, Release } from '@hashicorp/js-releases';
import * as path from 'path';
import * as semver from 'semver';
import * as vscode from 'vscode';
import TelemetryReporter from 'vscode-extension-telemetry';
import { ServerPath } from '../serverPath';
import { exec } from '../utils';
import { config } from '../vscodeUtils';

export const DEFAULT_LS_VERSION = 'latest';

export function isValidVersionString(value: string): boolean {
  return semver.validRange(value, { includePrerelease: true, loose: true }) !== null;
}

export async function updateOrInstall(
  lsVersion: string,
  extensionVersion: string,
  vscodeVersion: string,
  lsPath: ServerPath,
  reporter: TelemetryReporter,
): Promise<void> {
  if (await pathExists(lsPath.stgBinPath())) {
    // we updated during the last run while user was using editor
    // need to move to prod path now
    await vscode.workspace.fs.rename(vscode.Uri.file(lsPath.stgBinPath()), vscode.Uri.file(lsPath.binPath()), {
      overwrite: true,
    });
    return;
  }

  // Silently default to latest if an invalid version string is passed.
  // Actually telling the user about a bad string is left to the main extension code instead of here
  const versionString = isValidVersionString(lsVersion) ? lsVersion : DEFAULT_LS_VERSION;

  const lsPresent: boolean = await pathExists(lsPath.binPath());
  const autoUpdate = config('extensions').get<boolean>('autoUpdate', true);
  if (lsPresent === true && autoUpdate === false) {
    // we have a LS, but user does not want automatic updates
    return;
  }

  let release: Release;
  try {
    release = await getRequiredVersionRelease(versionString, extensionVersion, vscodeVersion);
  } catch (err) {
    console.log(
      `Error while finding Terraform language server release which satisfies range '${versionString}': ${err}`,
    );
    // if the releases site is inaccessible, report it and skip the install
    if (err instanceof Error) {
      reporter.sendTelemetryException(err);
    }
    return;
  }

  if (lsPresent === false) {
    // no ls present, need to download now
    // install to production path
    return installTerraformLS(lsPath.installPath(), release, extensionVersion, vscodeVersion, reporter);
  }

  const installedVersion: string | undefined = await getLsVersion(lsPath.binPath());
  if (installedVersion === undefined) {
    console.log(`Currently installed Terraform language server is version '${installedVersion}`);
    // ls is present but too old to tell us the version, need to update now
    // TODO remove existing
    // TODO install
    return installTerraformLS(lsPath.installPath(), release, extensionVersion, vscodeVersion, reporter);
  }

  reporter.sendTelemetryEvent('foundLsInstalled', { terraformLsVersion: installedVersion });

  if (semver.eq(release.version, installedVersion, { includePrerelease: true })) {
    // Already at the specified version, no update needed
    console.log(`Language server release is current: ${release.version}`);
    return;
  }

  console.log(`Currently installed Terraform language server is version '${installedVersion}`);
  if (autoUpdate === false) {
    // update indicated but user does not want automatic updates
    return;
  }

  // update indicated and user wants autoupdates
  if (semver.gt(release.version, installedVersion, { includePrerelease: true })) {
    // Upgrade
    console.log(`A newer language server release is available: ${release.version}`);
  } else if (semver.lt(release.version, installedVersion, { includePrerelease: true })) {
    // Downgrade
    console.log(`An older language server release is available: ${release.version}`);
  }

  // update
  return installTerraformLS(lsPath.stgInstallPath(), release, extensionVersion, vscodeVersion, reporter);
}

async function installTerraformLS(
  installPath: string,
  release: Release,
  extensionVersion: string,
  vscodeVersion: string,
  reporter: TelemetryReporter,
) {
  const userAgent = `Terraform-VSCode/${extensionVersion} VSCode/${vscodeVersion}`;

  // install
  reporter.sendTelemetryEvent('installingLs', { terraformLsVersion: release.version });

  const zipfile = path.resolve(installPath, `terraform-ls_v${release.version}.zip`);

  const os = getPlatform();
  const arch = getArch();
  const build = release.getBuild(os, arch);
  if (!build) {
    throw new Error(`Install error: no matching terraform-ls binary for ${os}/${arch}`);
  }

  if ((await pathExists(installPath)) === false) {
    await vscode.workspace.fs.createDirectory(vscode.Uri.file(installPath));
  }

  return vscode.window.withProgress(
    {
      cancellable: false,
      location: vscode.ProgressLocation.Window,
      title: 'Installing terraform-ls',
    },
    async (progress) => {
      progress.report({ increment: 30 });
      await release.download(build.url, zipfile, userAgent);

      progress.report({ increment: 30 });
      await release.verify(zipfile, build.filename);

      progress.report({ increment: 20 });
      await release.unpack(installPath, zipfile);

      progress.report({ increment: 10 });
      return vscode.workspace.fs.delete(vscode.Uri.file(zipfile));
    },
  );
}

async function getRequiredVersionRelease(
  versionString: string,
  extensionVersion: string,
  vscodeVersion: string,
): Promise<Release> {
  const userAgent = `Terraform-VSCode/${extensionVersion} VSCode/${vscodeVersion}`;

  try {
    const release = await getRelease('terraform-ls', versionString, userAgent);
    console.log(`Found Terraform language server version ${release.version} which satisfies range '${versionString}'`);
    return release;
  } catch (err) {
    if (versionString == DEFAULT_LS_VERSION) {
      throw err;
    }
    console.log(
      `Error while finding Terraform language server release which satisfies range '${versionString}' and will reattempt with '${DEFAULT_LS_VERSION}': ${err}`,
    );
    vscode.window.showWarningMessage(
      `No version matching ${versionString} found, searching for ${DEFAULT_LS_VERSION} instead`,
    );
  }

  // Attempt to find the latest release
  const release = await getRelease('terraform-ls', DEFAULT_LS_VERSION, userAgent);
  console.log(
    `Found Default Terraform language server version ${release.version} which satisfies range '${DEFAULT_LS_VERSION}'`,
  );
  return release;
}

async function getLsVersion(binPath: string): Promise<string | undefined> {
  try {
    const jsonCmd: { stdout: string } = await exec(binPath, ['version', '-json']);
    const jsonOutput = JSON.parse(jsonCmd.stdout);
    return jsonOutput.version;
  } catch (err) {
    // assume older version of LS which didn't have json flag
    return undefined;
  }
}

async function pathExists(filePath: string): Promise<boolean> {
  try {
    await vscode.workspace.fs.stat(vscode.Uri.file(filePath));
    return true;
  } catch (error) {
    return false;
  }
}

function getPlatform(): string {
  const platform = process.platform.toString();
  if (platform === 'win32') {
    return 'windows';
  }
  if (platform === 'sunos') {
    return 'solaris';
  }
  return platform;
}

function getArch(): string {
  const arch = process.arch;

  if (arch === 'ia32') {
    return '386';
  }
  if (arch === 'x64') {
    return 'amd64';
  }

  return arch;
}
