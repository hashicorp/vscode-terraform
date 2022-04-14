import * as vscode from 'vscode';
import TelemetryReporter from '@vscode/extension-telemetry';
import { ExecuteCommandParams, ExecuteCommandRequest } from 'vscode-languageclient';
import { LanguageClient } from 'vscode-languageclient/node';
import { Utils } from 'vscode-uri';
import { ClientHandler, TerraformLanguageClient } from '../clientHandler';
import { getActiveTextEditor } from '../vscodeUtils';

interface ModuleCaller {
  uri: string;
}

interface ModuleCallersResponse {
  version: number;
  moduleCallers: ModuleCaller[];
}

export async function updateTerraformStatusBar(
  documentUri: vscode.Uri,
  clientHandler: ClientHandler,
  terraformStatus: vscode.StatusBarItem,
  reporter: TelemetryReporter,
): Promise<void> {
  const client = clientHandler.getClient();
  if (client === undefined) {
    return;
  }

  const initSupported = clientHandler.clientSupportsCommand(`${client.commandPrefix}.terraform-ls.terraform.init`);
  if (!initSupported) {
    return;
  }

  try {
    const moduleUri = Utils.dirname(documentUri);
    const response = await moduleCallers(moduleUri.toString(), clientHandler, reporter);

    if (response.moduleCallers.length === 0) {
      const dirName = Utils.basename(moduleUri);

      terraformStatus.text = `$(refresh) ${dirName}`;
      terraformStatus.color = new vscode.ThemeColor('statusBar.foreground');
      terraformStatus.tooltip = `Click to run terraform init`;
      terraformStatus.command = 'terraform.initCurrent';
      terraformStatus.show();
    } else {
      terraformStatus.hide();
      terraformStatus.text = '';
    }
  } catch (err) {
    if (err instanceof Error) {
      vscode.window.showErrorMessage(err.message);
      reporter.sendTelemetryException(err);
    }
    terraformStatus.hide();
  }
}

export function execWorkspaceCommand(
  client: LanguageClient,
  params: ExecuteCommandParams,
  reporter: TelemetryReporter,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<any> {
  reporter.sendTelemetryEvent('execWorkspaceCommand', { command: params.command });
  return client.sendRequest(ExecuteCommandRequest.type, params);
}

export async function terraformCommand(
  command: string,
  clientHandler: ClientHandler,
  reporter: TelemetryReporter,
  languageServerExec = true,
): Promise<void> {
  const textEditor = getActiveTextEditor();
  if (!textEditor) {
    vscode.window.showWarningMessage(`Open a module then run terraform ${command} again`);
    return;
  }

  const languageClient = clientHandler.getClient();
  const moduleUri = Utils.dirname(textEditor.document.uri);
  const response = await moduleCallers(moduleUri.toString(), clientHandler, reporter);

  let selectedModule: string;
  if (response.moduleCallers.length > 1) {
    const selected = await vscode.window.showQuickPick(
      response.moduleCallers.map((m) => m.uri),
      { canPickMany: false },
    );
    if (!selected) {
      return;
    }

    selectedModule = selected;
  } else if (response.moduleCallers.length === 1) {
    selectedModule = response.moduleCallers[0].uri;
  } else {
    selectedModule = moduleUri.toString();
  }

  if (languageServerExec && languageClient) {
    const requestParams: ExecuteCommandParams = {
      command: `${languageClient.commandPrefix}.terraform-ls.terraform.${command}`,
      arguments: [`uri=${selectedModule}`],
    };
    return execWorkspaceCommand(languageClient.client, requestParams, reporter);
  }

  const terraformCommand = await vscode.window.showInputBox({
    value: `terraform ${command}`,
    prompt: `Run in ${selectedModule}`,
  });
  if (terraformCommand === undefined) {
    return;
  }

  const terminalName = `Terraform ${selectedModule}`;
  const moduleURI = vscode.Uri.parse(selectedModule);
  const terminal =
    vscode.window.terminals.find((t) => t.name === terminalName) ||
    vscode.window.createTerminal({ name: `Terraform ${selectedModule}`, cwd: moduleURI });
  terminal.sendText(terraformCommand);
  terminal.show();
}

async function moduleCallers(
  moduleUri: string,
  clientHandler: ClientHandler,
  reporter: TelemetryReporter,
): Promise<ModuleCallersResponse> {
  const client = clientHandler.getClient();
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

function modulesCallersCommand(
  languageClient: TerraformLanguageClient,
  moduleUri: string,
  reporter: TelemetryReporter,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<any> {
  const requestParams: ExecuteCommandParams = {
    command: `${languageClient.commandPrefix}.terraform-ls.module.callers`,
    arguments: [`uri=${moduleUri}`],
  };
  return execWorkspaceCommand(languageClient.client, requestParams, reporter);
}
