import * as path from 'path';
import * as vscode from 'vscode';

const INSTALL_FOLDER_NAME = 'lsp';
export const CUSTOM_BIN_PATH_OPTION_NAME = 'languageServer.pathToBinary';

export class ServerPath {
  private customBinPath: string;

  constructor(private context: vscode.ExtensionContext) {
    this.customBinPath = vscode.workspace.getConfiguration('terraform').get(CUSTOM_BIN_PATH_OPTION_NAME);
  }

  public installPath(): string {
    return this.context.asAbsolutePath(INSTALL_FOLDER_NAME);
  }

  public hasCustomBinPath(): boolean {
    return !!this.customBinPath;
  }

  public binPath(): string {
    if (this.hasCustomBinPath()) {
      return this.customBinPath;
    }

    return path.resolve(this.installPath(), this.binName());
  }

  public binName(): string {
    if (this.hasCustomBinPath()) {
      return path.basename(this.customBinPath);
    }

    if (process.platform === 'win32') {
      return 'terraform-ls.exe';
    }
    return 'terraform-ls';
  }
}
