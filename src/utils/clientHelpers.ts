import { Executable, InitializeResult } from 'vscode-languageclient/node';
import { config } from './vscode';
import { ServerPath } from './serverPath';

export async function getServerExecutable(lsPath: ServerPath): Promise<Executable> {
  const cmd = await lsPath.resolvedPathToBinary();
  const serverArgs = config('terraform').get<string[]>('languageServer.args', []);

  const executable: Executable = {
    command: cmd,
    args: serverArgs,
    options: {},
  };

  return executable;
}

export function getInitializationOptions() {
  /*
    This is basically a set of settings masquerading as a function. The intention
    here is to make room for this to be added to a configuration builder when
    we tackle #791
  */
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

export function clientSupportsCommand(initializeResult: InitializeResult | undefined, cmdName: string): boolean {
  if (!initializeResult) {
    return false;
  }

  return initializeResult.capabilities.executeCommandProvider?.commands.includes(cmdName) ?? false;
}
