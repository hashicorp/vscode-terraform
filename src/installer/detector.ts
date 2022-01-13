import * as vscode from 'vscode';
import { exec } from '../utils';

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

export async function pathExists(filePath: string): Promise<boolean> {
  try {
    await vscode.workspace.fs.stat(vscode.Uri.file(filePath));
    return true;
  } catch (error) {
    return false;
  }
}
