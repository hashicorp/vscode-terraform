import { execFile } from "child_process";
import * as vscode from 'vscode';
import { stripAnsi } from "./ansi";
import { getConfiguration } from "./configuration";
import { outputChannel } from "./extension";
import { Reporter } from "./telemetry";

export interface TerraformInvocationOptions {
  input?: string;
  keepAnsi?: boolean;
  reportMetric?: boolean;
}

function processOutput(output: string, options: TerraformInvocationOptions): string {
  if (options.keepAnsi)
    return output;
  return stripAnsi(output);
}

export function runTerraform(folder: vscode.WorkspaceFolder | string, args: string[], options: TerraformInvocationOptions = {}): Promise<string> {
  let path = getConfiguration().path;

  let cwd: string;
  if (typeof folder === "string")
    cwd = folder;
  else
    cwd = folder.uri.fsPath;

  outputChannel.appendLine(`Running terraform cwd='${cwd}' path='${path}' args=[${args.join(", ")}]`);

  return new Promise<string>((resolve, reject) => {
    const child = execFile(path, args, {
      encoding: 'utf8',
      maxBuffer: 1024 * 1024,
      cwd: cwd
    }, (error, stdout, stderr) => {
      if (options.reportMetric === true) {
        Reporter.trackEvent("terraform-invocation", {
          command: args[0],
          status: error ? error.name : "success"
        });
      }

      if (error) {
        const processedOutput = processOutput(stderr, options);
        outputChannel.appendLine(`Running terraform failed: ${error}`);
        reject(processedOutput);
      } else {
        outputChannel.appendLine(`Running terraform succeeded.`);
        resolve(processOutput(stdout, options));
      }
    });

    if (options.input) {
      child.stdin.write(options.input);
      child.stdin.end();
    }
  });
}