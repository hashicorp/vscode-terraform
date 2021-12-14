import { Release } from '@hashicorp/js-releases';
import * as semver from 'semver';
import * as vscode from 'vscode';
import TelemetryReporter from 'vscode-extension-telemetry';
import { ServerPath } from '../serverPath';
import { config } from '../vscodeUtils';
import {
  DEFAULT_LS_VERSION,
  getLsVersion,
  getRequiredVersionRelease,
  isValidVersionString,
  pathExists,
} from './detector';
import { installTerraformLS } from './installer';

export async function updateOrInstall(
  lsVersion: string,
  extensionVersion: string,
  vscodeVersion: string,
  lsPath: ServerPath,
  reporter: TelemetryReporter,
): Promise<void> {
  const stgingExists = await pathExists(lsPath.stgBinPath());
  if (stgingExists) {
    // LS was updated during the last run while user was using the extension
    // Do not check for updates here, as normal execution flow will handle decision logic later
    // Need to move stg path to prod path now and return normal execution
    await vscode.workspace.fs.rename(vscode.Uri.file(lsPath.stgBinPath()), vscode.Uri.file(lsPath.binPath()), {
      overwrite: true,
    });
    return;
  }

  // Silently default to latest if an invalid version string is passed.
  // Actually telling the user about a bad string is left to the main extension code instead of here
  const versionString = isValidVersionString(lsVersion) ? lsVersion : DEFAULT_LS_VERSION;

  const lsPresent = await pathExists(lsPath.binPath());
  const autoUpdate = config('extensions').get<boolean>('autoUpdate', true);
  if (lsPresent === true && autoUpdate === false) {
    // LS is present in prod path, but user does not want automatic updates
    // Return normal execution
    return;
  }

  // Get LS release information from hashicorp release site
  // Fall back to latest if not requested version not available
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
    // LS is not present, need to download now in order to function
    // Install directly to production path and return normal execution
    return installTerraformLS(lsPath.installPath(), release, extensionVersion, vscodeVersion, reporter);
  }

  // We know there is an LS Present at this point, find out version if possible
  const installedVersion = await getLsVersion(lsPath.binPath());
  if (installedVersion === undefined) {
    console.log(`Currently installed Terraform language server is version '${installedVersion}`);
    // ls is present but too old to tell us the version, so need to update now
    return installTerraformLS(lsPath.installPath(), release, extensionVersion, vscodeVersion, reporter);
  }

  // We know there is an LS present and know the version, so decide whether to update or not
  console.log(`Currently installed Terraform language server is version '${installedVersion}`);
  reporter.sendTelemetryEvent('foundLsInstalled', { terraformLsVersion: installedVersion });

  // Already at the latest or specified version, no update needed
  // return to normal execution flow
  if (semver.eq(release.version, installedVersion, { includePrerelease: true })) {
    console.log(`Language server release is current: ${release.version}`);
    return;
  }

  // We used to prompt for decision here, but effectively downgrading or upgrading
  // are the same operation so log decision and update
  if (semver.gt(release.version, installedVersion, { includePrerelease: true })) {
    // Upgrade
    console.log(`A newer language server release is available: ${release.version}`);
  } else if (semver.lt(release.version, installedVersion, { includePrerelease: true })) {
    // Downgrade
    console.log(`An older language server release is available: ${release.version}`);
  }

  // Update indicated and user wants autoupdates, so update to latest or specified version
  return installTerraformLS(lsPath.stgInstallPath(), release, extensionVersion, vscodeVersion, reporter);
}
