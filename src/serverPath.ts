import * as path from 'path';
import * as vscode from 'vscode';

const INSTALL_FOLDER_NAME = 'bin';
export const CUSTOM_BIN_PATH_OPTION_NAME = 'languageServer.pathToBinary';

export class ServerPath {
  private customBinPath: string;

  constructor(private context: vscode.ExtensionContext) {
    this.customBinPath = vscode.workspace.getConfiguration('terraform').get(CUSTOM_BIN_PATH_OPTION_NAME);
  }

  public installPath(): string {
    return path.join(this.context.globalStorageUri.fsPath, INSTALL_FOLDER_NAME);
  }

  // legacyBinPath represents old location where LS was installed.
  // We only use it to ensure that old installations are removed
  // from there after LS is installed into the new path.
  public legacyBinPath(): string {
    return path.resolve(this.context.asAbsolutePath('lsp'), this.binName());
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
