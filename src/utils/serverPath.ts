import * as path from 'path';
import * as vscode from 'vscode';
import * as which from 'which';

const INSTALL_FOLDER_NAME = 'bin';
const CUSTOM_BIN_PATH_OPTION_NAME = 'languageServer.pathToBinary';

export class ServerPath {
  private customBinPath: string | undefined;

  constructor(private context: vscode.ExtensionContext) {
    this.customBinPath = vscode.workspace.getConfiguration('terraform').get(CUSTOM_BIN_PATH_OPTION_NAME);
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
      return 'terraform-ls.exe';
    }
    return 'terraform-ls';
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
        extraHint = `. Check "${CUSTOM_BIN_PATH_OPTION_NAME}" in your settings.`;
      }
      throw new Error(`Unable to launch language server: ${err instanceof Error ? err.message : err}${extraHint}`);
    }

    return cmd;
  }
}
