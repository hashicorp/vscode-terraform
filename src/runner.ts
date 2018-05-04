import * as vscode from 'vscode';

import { getConfiguration } from "./configuration";
import { execFile } from "child_process";
import { stripAnsi } from "./ansi";

export interface TerraformInvocationOptions {
  input?: string;
  keepAnsi?: boolean;
}

function processOutput(output: string, options: TerraformInvocationOptions): string {
  if (options.keepAnsi)
    return output;
  return stripAnsi(output);
}

export function runTerraform(args: string[], options: TerraformInvocationOptions = {}): Promise<string> {
  let path = getConfiguration().path;
  console.log(`Running terraform cwd='${process.cwd()}' path='${path}' args=[${args.join(", ")}]`);

  return new Promise<string>((resolve, reject) => {

    const child = execFile(path, args, {
      encoding: 'utf8',
      maxBuffer: 1024 * 1024,
      cwd: vscode.workspace.workspaceFolders[0].uri.fsPath
    }, (error, stdout, stderr) => {
      if (error) {
        console.log(`Running terraform failed: ${error}: ${stderr}`);
        reject(processOutput(stderr, options));
      } else {
        resolve(processOutput(stdout, options));
      }
    });

    if (options.input) {
      child.stdin.write(options.input);
      child.stdin.end();
    }
  });
}