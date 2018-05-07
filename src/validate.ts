import { execFile } from 'child_process';
import * as vscode from 'vscode';
import { outputChannel } from './extension';

export function validateCommand() {
  const configuration = vscode.workspace.getConfiguration("terraform");
  const workspaceDir = vscode.workspace.rootPath;

  if (workspaceDir === undefined) {
    vscode.window.showWarningMessage("terraform.Validate can only be used when opening a folder");
    return;
  }

  validate(configuration["path"], configuration["templateDirectory"], workspaceDir)
    .then(() => {
      vscode.window.showInformationMessage("Validation succeeded.");
    }).catch((error) => {
      outputChannel.appendLine("terraform.validate: Failed:");
      outputChannel.append(error);
      outputChannel.show(true);
      vscode.window.showErrorMessage("Validation failed, more information in the output tab.");
    });
}

function validate(execPath: string, directory: string, workspaceDir: string): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    let commandLineArgs = ["validate", "-no-color"];
    if (directory !== undefined) {
      commandLineArgs.push(directory);
    }

    const child = execFile(execPath, commandLineArgs, {
      cwd: workspaceDir,
      encoding: 'utf8',
      maxBuffer: 1024 * 1024
    }, (error, stdout, stderr) => {
      if (error) {
        reject(stderr);
      } else {
        resolve(stdout);
      }
    });
  });
}
