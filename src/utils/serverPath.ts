// Copyright (c) The OpenTofu Authors
// SPDX-License-Identifier: MPL-2.0
// Copyright (c) HashiCorp, Inc.
// SPDX-License-Identifier: MPL-2.0

import * as path from 'path';
import * as vscode from 'vscode';
import * as which from 'which';
import { config } from './vscode';

const INSTALL_FOLDER_NAME = 'bin';

export class ServerPath {
  private customBinPath: string | undefined;

  constructor(private context: vscode.ExtensionContext) {
    this.customBinPath = config('opentofu').get('languageServer.path');
  }

  private installPath(): string {
    return path.join(this.context.extensionPath, INSTALL_FOLDER_NAME);
  }

  public hasCustomBinPath(): boolean {
    return !!this.customBinPath;
  }

  private binPath(): string {
    if (this.customBinPath) {
      return this.customBinPath;
    }

    return path.resolve(this.installPath(), this.binName());
  }

  private binName(): string {
    if (this.customBinPath) {
      return path.basename(this.customBinPath);
    }

    if (process.platform === 'win32') {
      return 'opentofu-ls.exe';
    }
    return 'opentofu-ls';
  }

  public async resolvedPathToBinary(): Promise<string> {
    const pathToBinary = this.binPath();
    let cmd: string;
    try {
      if (path.isAbsolute(pathToBinary)) {
        await vscode.workspace.fs.stat(vscode.Uri.file(pathToBinary));
        cmd = pathToBinary;
      } else {
        cmd = which.sync(pathToBinary);
      }
      console.log(`Found server at ${cmd}`);
    } catch (err) {
      let extraHint = '';
      if (this.customBinPath) {
        extraHint = `. Check "opentofu.languageServer.path" in your settings.`;
      }
      throw new Error(`Unable to launch language server: ${err instanceof Error ? err.message : err}${extraHint}`);
    }

    return cmd;
  }
}
