import TelemetryReporter from '@vscode/extension-telemetry';
import * as vscode from 'vscode';
import { ExecuteCommandParams, ExecuteCommandRequest, LanguageClient } from 'vscode-languageclient/node';
import { Utils } from 'vscode-uri';
import { getActiveTextEditor } from './utils/vscode';
import { clientSupportsCommand } from './utils/clientHelpers';

/* eslint-disable @typescript-eslint/naming-convention */
export interface ModuleCaller {
  uri: string;
}

export interface ModuleCallersResponse {
  version: number;
  moduleCallers: ModuleCaller[];
}

export interface ModuleCall {
  name: string;
  source_addr: string;
  version?: string;
  source_type?: string;
  docs_link?: string;
  dependent_modules: ModuleCall[];
}

export interface ModuleCallsResponse {
  v: number;
  module_calls: ModuleCall[];
}

interface ModuleProvidersResponse {
  v: number;
  provider_requirements: {
    [provider: string]: {
      display_name: string;
      version_constraint?: string;
      docs_link?: string;
    };
  };
  installed_providers: {
    [provider: string]: string;
  };
}
/* eslint-enable @typescript-eslint/naming-convention */

export async function moduleCallers(
  moduleUri: string,
  client: LanguageClient,
  reporter: TelemetryReporter,
): Promise<ModuleCallersResponse> {
  const command = 'terraform-ls.module.callers';

  const response = await execWorkspaceLSCommand<ModuleCallersResponse>(command, moduleUri, client, reporter);

  return response;
}

export async function moduleCalls(
  moduleUri: string,
  client: LanguageClient,
  reporter: TelemetryReporter,
): Promise<ModuleCallsResponse> {
  const command = 'terraform-ls.module.calls';

  const response = await execWorkspaceLSCommand<ModuleCallsResponse>(command, moduleUri, client, reporter);

  return response;
}

export async function moduleProviders(
  moduleUri: string,
  client: LanguageClient,
  reporter: TelemetryReporter,
): Promise<ModuleProvidersResponse> {
  const command = 'terraform-ls.module.providers';

  const response = await execWorkspaceLSCommand<ModuleProvidersResponse>(command, moduleUri, client, reporter);

  return response;
}

export async function terraformInitCommand(client: LanguageClient, reporter: TelemetryReporter) {
  const workspaceFolders = vscode.workspace.workspaceFolders;
  const selected = await vscode.window.showOpenDialog({
    canSelectFiles: false,
    canSelectFolders: true,
    canSelectMany: false,
    defaultUri: workspaceFolders ? workspaceFolders[0]?.uri : undefined,
    openLabel: 'Initialize',
  });
  if (selected === undefined) {
    return;
  }

  const moduleUri = selected[0];
  const command = `terraform-ls.terraform.init`;

  return execWorkspaceLSCommand<void>(command, moduleUri.toString(), client, reporter);
}

export async function terraformCommand(
  command: string,
  client: LanguageClient,
  reporter: TelemetryReporter,
  useShell = false,
): Promise<void> {
  const textEditor = getActiveTextEditor();
  if (textEditor === undefined) {
    vscode.window.showWarningMessage(`Open a module file and then run terraform ${command} again`);
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

  const fullCommand = `terraform-ls.terraform.${command}`;

  await client.onReady();

  return execWorkspaceLSCommand<void>(fullCommand, selectedModule, client, reporter);
}

async function execWorkspaceLSCommand<T>(
  command: string,
  moduleUri: string,
  client: LanguageClient,
  reporter: TelemetryReporter,
): Promise<T> {
  await client.onReady();

  const commandSupported = clientSupportsCommand(client.initializeResult, command);
  if (!commandSupported) {
    throw new Error(`${command} not supported by this terraform-ls version`);
  }

  const params: ExecuteCommandParams = {
    command: command,
    arguments: [`uri=${moduleUri}`],
  };

  reporter.sendTelemetryEvent('execWorkspaceCommand', { command: params.command });

  return client.sendRequest<ExecuteCommandParams, T, void>(ExecuteCommandRequest.type, params);
}

async function getSelectedModule(moduleUri: vscode.Uri, moduleCallers: ModuleCaller[]): Promise<string | undefined> {
  let selectedModule: string;
  if (moduleCallers === undefined) {
    return moduleUri.toString();
  }

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
