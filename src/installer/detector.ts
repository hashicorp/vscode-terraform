import { getRelease, Release } from '@hashicorp/js-releases';
import * as semver from 'semver';
import * as vscode from 'vscode';
import { exec } from '../utils';

export const DEFAULT_LS_VERSION = 'latest';

export function isValidVersionString(value: string): boolean {
  return semver.validRange(value, { includePrerelease: true, loose: true }) !== null;
}

export async function getLsVersion(binPath: string): Promise<string | undefined> {
  try {
    const jsonCmd: { stdout: string } = await exec(binPath, ['version', '-json']);
    const jsonOutput = JSON.parse(jsonCmd.stdout);
    return jsonOutput.version;
  } catch (err) {
    // assume older version of LS which didn't have json flag
    // return undefined as regex matching isn't useful here
    // if it's old enough to not have the json version, we would be updating anyway
    return undefined;
  }
}

export async function getRequiredVersionRelease(
  versionString: string,
  extensionVersion: string,
  vscodeVersion: string,
): Promise<Release> {
  const userAgent = `Terraform-VSCode/${extensionVersion} VSCode/${vscodeVersion}`;

  // Take the user requested version and query the hashicorp release site
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

  // User supplied version is either invalid or a version could not satisfy the range requested
  // Attempt to find the latest release, as we need a LS to function
  const release = await getRelease('terraform-ls', DEFAULT_LS_VERSION, userAgent);
  console.log(
    `Found Default Terraform language server version ${release.version} which satisfies range '${DEFAULT_LS_VERSION}'`,
  );
  return release;
}

export async function pathExists(filePath: string): Promise<boolean> {
  try {
    await vscode.workspace.fs.stat(vscode.Uri.file(filePath));
    return true;
  } catch (error) {
    return false;
  }
}
