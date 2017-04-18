import * as vscode from 'vscode';
import { exec } from 'child_process';

import { Parser } from './parser';

import { getConfiguration } from './configuration';

export function process(text: string): Promise<Parser.IndexResult> {
  const cfg = getConfiguration();
  const path = cfg.indexing.indexerPath;
  const commandLine = `${path} -`;

  return new Promise<Parser.IndexResult>((resolve, reject) => {
    let child = exec(commandLine, {
      encoding: "utf8",
      cwd: vscode.workspace.rootPath
    }, (error, stdout, stderr) => {
      if (error) {
        reject(error);
      } else {
        try {
          resolve(Parser.parseIndex(stdout));
        } catch (ex) {
          reject(ex);
        }
      }
    });
    child.stdin.end(text);
  });
}

