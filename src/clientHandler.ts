import { Executable, ServerOptions } from 'vscode-languageclient/node';
import { config } from './utils/vscode';
import { ServerPath } from './utils/serverPath';

export async function getServerOptions(lsPath: ServerPath): Promise<ServerOptions> {
  const cmd = await lsPath.resolvedPathToBinary();
  const serverArgs = config('terraform').get<string[]>('languageServer.args', []);

  const executable: Executable = {
    command: cmd,
    args: serverArgs,
    options: {},
  };
  const serverOptions: ServerOptions = {
    run: executable,
    debug: executable,
  };

  // this.outputChannel.appendLine(`Launching language server: ${cmd} ${serverArgs.join(' ')}`);

  return serverOptions;
}

export function getInitializationOptions() {
  const rootModulePaths = config('terraform-ls').get<string[]>('rootModules', []);
  const terraformExecPath = config('terraform-ls').get<string>('terraformExecPath', '');
  const terraformExecTimeout = config('terraform-ls').get<string>('terraformExecTimeout', '');
  const terraformLogFilePath = config('terraform-ls').get<string>('terraformLogFilePath', '');
  const excludeModulePaths = config('terraform-ls').get<string[]>('excludeRootModules', []);
  const ignoreDirectoryNames = config('terraform-ls').get<string[]>('ignoreDirectoryNames', []);

  const ignoreSingleFileWarning = config('terraform').get<boolean>('languageServer.ignoreSingleFileWarning', false);

  if (rootModulePaths.length > 0 && excludeModulePaths.length > 0) {
    throw new Error(
      'Only one of rootModules and excludeRootModules can be set at the same time, please remove the conflicting config and reload',
    );
  }

  const experimentalFeatures = config('terraform-ls').get('experimentalFeatures');
  const initializationOptions = {
    experimentalFeatures,
    ignoreSingleFileWarning,
    ...(terraformExecPath.length > 0 && { terraformExecPath }),
    ...(terraformExecTimeout.length > 0 && { terraformExecTimeout }),
    ...(terraformLogFilePath.length > 0 && { terraformLogFilePath }),
    ...(rootModulePaths.length > 0 && { rootModulePaths }),
    ...(excludeModulePaths.length > 0 && { excludeModulePaths }),
    ...(ignoreDirectoryNames.length > 0 && { ignoreDirectoryNames }),
  };

  return initializationOptions;
}
