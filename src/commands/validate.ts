import { execFile } from 'child_process';
import * as vscode from 'vscode';
import { Command } from './command';

export class ValidateCommand extends Command {
  constructor() {
    super("validate");
  }

  protected async perform(): Promise<any> {
    const configuration = vscode.workspace.getConfiguration("terraform");
    const workspaceDir = vscode.workspace.rootPath;

    if (workspaceDir === undefined) {
      this.logger.warn("Can only be used when opening a folder");
      return await vscode.window.showWarningMessage("terraform.Validate can only be used when opening a folder");
    }

    try {
      const output = await validate(configuration["path"], configuration["templateDirectory"], workspaceDir);
      for (const line of output.split('\n')) {
        this.logger.info("output: ", line);
      }
    } catch (err) {
      this.logger.warn("Validation failed: ", err);
      return await vscode.window.showErrorMessage("Validation failed, more information in the output tab.");
    }
  }
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
