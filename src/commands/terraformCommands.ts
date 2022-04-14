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

export function execWorkspaceCommand(
  client: LanguageClient,
  params: ExecuteCommandParams,
  reporter: TelemetryReporter,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<any> {
  reporter.sendTelemetryEvent('execWorkspaceCommand', { command: params.command });
  return client.sendRequest(ExecuteCommandRequest.type, params);
}

export async function moduleCallers(
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

export async function terraformCommand(
  command: string,
  clientHandler: ClientHandler,
  reporter: TelemetryReporter,
  languageServerExec = true,
): Promise<void> {
  const textEditor = getActiveTextEditor();
  if (textEditor) {
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
    } else {
      const terminalName = `Terraform ${selectedModule}`;
      const moduleURI = vscode.Uri.parse(selectedModule);
      const terraformCommand = await vscode.window.showInputBox({
        value: `terraform ${command}`,
        prompt: `Run in ${selectedModule}`,
      });
      if (terraformCommand) {
        const terminal =
          vscode.window.terminals.find((t) => t.name === terminalName) ||
          vscode.window.createTerminal({ name: `Terraform ${selectedModule}`, cwd: moduleURI });
        terminal.sendText(terraformCommand);
        terminal.show();
      }
      return;
    }
  } else {
    vscode.window.showWarningMessage(`Open a module then run terraform ${command} again`);
    return;
  }
}

async function modulesCallersCommand(
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
