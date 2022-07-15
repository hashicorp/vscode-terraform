import TelemetryReporter from '@vscode/extension-telemetry';
import * as vscode from 'vscode';
import { ExecuteCommandParams, ExecuteCommandRequest, LanguageClient } from 'vscode-languageclient/node';
import { Utils } from 'vscode-uri';
import { getActiveTextEditor } from './utils/vscode';

interface ModuleCaller {
  uri: string;
}

interface ModuleCallersResponse {
  version: number;
  moduleCallers: ModuleCaller[];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function execWorkspaceCommand(
  client: LanguageClient,
  params: ExecuteCommandParams,
  reporter: TelemetryReporter,
): Promise<any> {
  reporter.sendTelemetryEvent('execWorkspaceCommand', { command: params.command });
  return client.sendRequest(ExecuteCommandRequest.type, params);
}

export async function moduleCallers(
  moduleUri: string,
  client: LanguageClient,
  reporter: TelemetryReporter,
): Promise<ModuleCallersResponse> {
  if (client === undefined) {
    return {
      version: 0,
      moduleCallers: [],
    };
  }

  const response = await modulesCallersCommand(client, moduleUri, reporter);
  const moduleCallers: ModuleCaller[] = response.callers;

  return { version: response.v, moduleCallers };
}

export async function terraformCommand(
  command: string,
  client: LanguageClient,
  reporter: TelemetryReporter,
  useShell = false,
): Promise<void> {
  const textEditor = getActiveTextEditor();
  if (textEditor === undefined) {
    vscode.window.showWarningMessage(`Open a module then run terraform ${command} again`);
    return;
  }

  const moduleUri = Utils.dirname(textEditor.document.uri);
  const response = await moduleCallers(moduleUri.toString(), client, reporter);

  const selectedModule = await getSelectedModule(moduleUri, response.moduleCallers);
  if (selectedModule === undefined) {
    return;
  }

  if (useShell) {
    const terminalName = `Terraform ${selectedModule}`;
    const moduleURI = vscode.Uri.parse(selectedModule);
    const terraformCommand = await vscode.window.showInputBox({
      value: `terraform ${command}`,
      prompt: `Run in ${selectedModule}`,
    });
    if (terraformCommand === undefined) {
      return;
    }

    const terminal =
      vscode.window.terminals.find((t) => t.name === terminalName) ||
      vscode.window.createTerminal({ name: `Terraform ${selectedModule}`, cwd: moduleURI });
    terminal.sendText(terraformCommand);
    terminal.show();
    return;
  }

  const requestParams: ExecuteCommandParams = {
    command: `terraform-ls.terraform.${command}`,
    arguments: [`uri=${selectedModule}`],
  };

  try {
    await client.onReady();

    return execWorkspaceCommand(client, requestParams, reporter);
  } catch (error) {
    if (error instanceof Error) {
      vscode.window.showErrorMessage(error instanceof Error ? error.message : error);
    } else if (typeof error === 'string') {
      vscode.window.showErrorMessage(error);
    }
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function modulesCallersCommand(
  languageClient: LanguageClient,
  moduleUri: string,
  reporter: TelemetryReporter,
): Promise<any> {
  const requestParams: ExecuteCommandParams = {
    command: `terraform-ls.module.callers`,
    arguments: [`uri=${moduleUri}`],
  };
  return execWorkspaceCommand(languageClient, requestParams, reporter);
}

async function getSelectedModule(moduleUri: vscode.Uri, moduleCallers: ModuleCaller[]): Promise<string | undefined> {
  let selectedModule: string;
  if (moduleCallers.length > 1) {
    const selected = await vscode.window.showQuickPick(
      moduleCallers.map((m) => m.uri),
      { canPickMany: false },
    );
    if (selected === undefined) {
      return selected;
    }

    selectedModule = selected;
  } else if (moduleCallers.length === 1) {
    selectedModule = moduleCallers[0].uri;
  } else {
    selectedModule = moduleUri.toString();
  }
  return selectedModule;
}
