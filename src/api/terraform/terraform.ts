/**
 * Copyright (c) HashiCorp, Inc.
 * SPDX-License-Identifier: MPL-2.0
 */

import TelemetryReporter from '@vscode/extension-telemetry';
import * as vscode from 'vscode';
import { ExecuteCommandParams, ExecuteCommandRequest, LanguageClient } from 'vscode-languageclient/node';
import { Utils } from 'vscode-uri';
import { getActiveTextEditor } from './../../utils/vscode';
import { clientSupportsCommand } from './../../utils/clientHelpers';

export interface ModuleCaller {
  uri: string;
}

export interface ModuleCallersResponse {
  v: number;
  callers: ModuleCaller[];
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

export interface ModuleProvidersResponse {
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

export interface TerraformInfoResponse {
  v: number;
  required_version?: string;
  discovered_version?: string;
}

export async function terraformVersion(
  moduleUri: string,
  client: LanguageClient,
  reporter: TelemetryReporter,
): Promise<TerraformInfoResponse> {
  const command = 'terraform-ls.module.terraform';

  const response = await execWorkspaceLSCommand<TerraformInfoResponse>(command, moduleUri, client, reporter);

  return response;
}

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

export async function initAskUserCommand(client: LanguageClient, reporter: TelemetryReporter) {
  try {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    const selected = await vscode.window.showOpenDialog({
      canSelectFiles: false,
      canSelectFolders: true,
      canSelectMany: false,
      title: 'Choose which workspace to initialize with terraform init',
      defaultUri: workspaceFolders ? workspaceFolders[0]?.uri : undefined,
      openLabel: 'Initialize',
    });
    if (selected === undefined) {
      return;
    }

    const moduleUri = selected[0];
    const command = `terraform-ls.terraform.init`;

    // eslint-disable-next-line @typescript-eslint/no-invalid-void-type
    await execWorkspaceLSCommand<void>(command, moduleUri.toString(), client, reporter);
  } catch (error) {
    if (error instanceof Error) {
      vscode.window.showErrorMessage(error.message);
    } else if (typeof error === 'string') {
      vscode.window.showErrorMessage(error);
    }
  }
}

export async function initCurrentOpenFileCommand(client: LanguageClient, reporter: TelemetryReporter) {
  try {
    await terraformCommand('initCurrent', client, reporter);
  } catch (error) {
    if (error instanceof Error) {
      vscode.window.showErrorMessage(error.message);
    } else if (typeof error === 'string') {
      vscode.window.showErrorMessage(error);
    }
  }
}

export async function command(command: string, client: LanguageClient, reporter: TelemetryReporter, useShell = false) {
  try {
    await terraformCommand(command, client, reporter, useShell);
  } catch (error) {
    if (error instanceof Error) {
      vscode.window.showErrorMessage(error.message);
    } else if (typeof error === 'string') {
      vscode.window.showErrorMessage(error);
    }
  }
}

async function terraformCommand(
  command: string,
  client: LanguageClient,
  reporter: TelemetryReporter,
  useShell = false,
): Promise<void> {
  const textEditor = getActiveTextEditor();
  if (textEditor === undefined) {
    vscode.window.showErrorMessage(`Open a Terraform module file and then run terraform ${command} again`);
    return;
  }

  const moduleUri = Utils.dirname(textEditor.document.uri);
  const response = await moduleCallers(moduleUri.toString(), client, reporter);

  const selectedModule = await getSelectedModule(moduleUri, response.callers);
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
      vscode.window.terminals.find((t) => t.name === terminalName) ??
      vscode.window.createTerminal({ name: `Terraform ${selectedModule}`, cwd: moduleURI });
    terminal.sendText(terraformCommand);
    terminal.show();

    reporter.sendTelemetryEvent('execShellCommand', { command: command });
    return;
  }

  const fullCommand = `terraform-ls.terraform.${command}`;

  // eslint-disable-next-line @typescript-eslint/no-invalid-void-type
  await execWorkspaceLSCommand<void>(fullCommand, selectedModule, client, reporter);
}

async function execWorkspaceLSCommand<T>(
  command: string,
  moduleUri: string,
  client: LanguageClient,
  reporter: TelemetryReporter,
): Promise<T> {
  // record whether we use terraform.init or terraform.initcurrent vscode commands
  // this is hacky, but better than propagating down another parameter just to handle
  // which init command we used
  if (command === 'terraform-ls.terraform.initCurrent') {
    reporter.sendTelemetryEvent('execWorkspaceCommand', { command: command });
    // need to change to terraform-ls command after detection
    command = 'terraform-ls.terraform.init';
  }

  const commandSupported = clientSupportsCommand(client.initializeResult, command);
  if (!commandSupported) {
    throw new Error(`${command} not supported by this terraform-ls version`);
  }

  const params: ExecuteCommandParams = {
    command: command,
    arguments: [`uri=${moduleUri}`],
  };

  // eslint-disable-next-line @typescript-eslint/no-invalid-void-type
  return client.sendRequest<ExecuteCommandParams, T, void>(ExecuteCommandRequest.type, params);
}

async function getSelectedModule(moduleUri: vscode.Uri, moduleCallers: ModuleCaller[]): Promise<string | undefined> {
  let selectedModule: string;
  if (moduleCallers.length > 1) {
    const selected = await vscode.window.showQuickPick(
      moduleCallers.map((m) => m.uri),
      {
        canPickMany: false,
        title: 'Choose which workspace to initialize with terraform init',
      },
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
