import { execFile } from 'child_process';
import * as vscode from 'vscode';
import { getConfiguration } from '../configuration';
import { IndexAdapter } from '../index/index-adapter';
import { Command } from './command';

export class ValidateCommand extends Command {
  constructor(private index: IndexAdapter) {
    super("validate");
  }

  protected async perform(): Promise<any> {
    const path = getConfiguration().path;

    try {
      for (const group of this.index.index.groups) {
        this.logger.info(`Validating group ${group.uri.toString()}`);
        const output = await validate(path, group.uri.toString());
        for (const line of output.split('\n')) {
          this.logger.info("output: ", line);
        }
      }
    } catch (err) {
      this.logger.warn("Validation failed: ", err);
      return await vscode.window.showErrorMessage("Validation failed, more information in the output tab.");
    }
  }
}

function validate(execPath: string, directory: string): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    let commandLineArgs = ["validate", "-no-color"];
    if (directory !== undefined) {
      commandLineArgs.push(directory);
    }

    const child = execFile(execPath, commandLineArgs, {
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
