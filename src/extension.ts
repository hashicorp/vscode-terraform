import * as vscode from 'vscode';
import TelemetryReporter from 'vscode-extension-telemetry';
import { ExecuteCommandParams, ExecuteCommandRequest } from 'vscode-languageclient';
import { LanguageClient } from 'vscode-languageclient/node';
import { Utils } from 'vscode-uri';
import { ClientHandler, TerraformLanguageClient } from './clientHandler';
import { defaultVersionString, isValidVersionString, LanguageServerInstaller } from './languageServerInstaller';
import { ModuleProvider } from './providers/moduleProvider';
import { ServerPath } from './serverPath';
import { SingleInstanceTimeout } from './utils';
import { config, getActiveTextEditor } from './vscodeUtils';

const terraformStatus = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 0);
const outputChannel: vscode.OutputChannel = vscode.window.createOutputChannel('HashiCorp Terraform');

let reporter: TelemetryReporter;
let clientHandler: ClientHandler;
const languageServerUpdater = new SingleInstanceTimeout();

export interface TerraformExtension {
  handler: ClientHandler;
  moduleCallers;
}

export async function activate(context: vscode.ExtensionContext): Promise<TerraformExtension> {
  const manifest = context.extension.packageJSON;
  reporter = new TelemetryReporter(context.extension.id, manifest.version, manifest.appInsightsKey);
  context.subscriptions.push(reporter);

  const lsPath = new ServerPath(context);
  clientHandler = new ClientHandler(lsPath, outputChannel, reporter);

  // get rid of pre-2.0.0 settings
  if (config('terraform').has('languageServer.enabled')) {
    try {
      await config('terraform').update(
        'languageServer',
        { enabled: undefined, external: true },
        vscode.ConfigurationTarget.Global,
      );
    } catch (err) {
      console.error(`Error trying to erase pre-2.0.0 settings: ${err.message}`);
    }
  }

  if (config('terraform').has('languageServer.requiredVersion')) {
    const langServerVer = config('terraform').get('languageServer.requiredVersion', defaultVersionString);
    if (!isValidVersionString(langServerVer)) {
      vscode.window.showWarningMessage(
        `The Terraform Language Server Version string '${langServerVer}' is not a valid semantic version and will be ignored.`,
      );
    }
  }

  // Subscriptions
  context.subscriptions.push(
    vscode.commands.registerCommand('terraform.enableLanguageServer', async () => {
      if (!enabled()) {
        const current = config('terraform').get('languageServer');
        await config('terraform').update(
          'languageServer',
          Object.assign(current, { external: true }),
          vscode.ConfigurationTarget.Global,
        );
      }
      return updateLanguageServer(manifest.version, clientHandler, lsPath);
    }),
    vscode.commands.registerCommand('terraform.disableLanguageServer', async () => {
      if (enabled()) {
        const current = config('terraform').get('languageServer');
        await config('terraform').update(
          'languageServer',
          Object.assign(current, { external: false }),
          vscode.ConfigurationTarget.Global,
        );
      }
      languageServerUpdater.clear();
      return clientHandler.stopClients();
    }),
    vscode.commands.registerCommand('terraform.apply', async () => {
      await terraformCommand('apply', false, clientHandler);
    }),
    vscode.commands.registerCommand('terraform.init', async () => {
      const selected = await vscode.window.showOpenDialog({
        canSelectFiles: false,
        canSelectFolders: true,
        canSelectMany: false,
        defaultUri: vscode.workspace.workspaceFolders[0].uri,
        openLabel: 'Initialize',
      });
      if (selected) {
        const moduleUri = selected[0];
        const client = clientHandler.getClient();
        const requestParams: ExecuteCommandParams = {
          command: `terraform-ls.terraform.init`,
          arguments: [`uri=${moduleUri}`],
        };
        await execWorkspaceCommand(client.client, requestParams);
      }
    }),
    vscode.commands.registerCommand('terraform.initCurrent', async () => {
      await terraformCommand('init', true, clientHandler);
    }),
    vscode.commands.registerCommand('terraform.plan', async () => {
      await terraformCommand('plan', false, clientHandler);
    }),
    vscode.commands.registerCommand('terraform.validate', async () => {
      await terraformCommand('validate', true, clientHandler);
    }),
    vscode.workspace.onDidChangeConfiguration(async (event: vscode.ConfigurationChangeEvent) => {
      if (event.affectsConfiguration('terraform') || event.affectsConfiguration('terraform-ls')) {
        const reloadMsg = 'Reload VSCode window to apply language server changes';
        const selected = await vscode.window.showInformationMessage(reloadMsg, 'Reload');
        if (selected === 'Reload') {
          vscode.commands.executeCommand('workbench.action.reloadWindow');
        }
      }
    }),
    vscode.workspace.onDidChangeWorkspaceFolders(async (event: vscode.WorkspaceFoldersChangeEvent) => {
      // TODO: figure out if this is still necessary
      if (event.removed.length > 0) {
        await clientHandler.stopClients();
      }
      if (event.added.length > 0) {
        await clientHandler.startClients();
      }
    }),
    vscode.window.onDidChangeVisibleTextEditors(async () => {
      const textEditor = getActiveTextEditor();
      if (textEditor === undefined) {
        return;
      }
      if (textEditor.document === undefined) {
        return;
      }
      await updateTerraformStatusBar(textEditor.document.uri);
    }),
    vscode.window.registerTreeDataProvider('terraform.modules', new ModuleProvider(context, clientHandler)),
  );

  if (enabled()) {
    try {
      await updateLanguageServer(manifest.version, clientHandler, lsPath);
      vscode.commands.executeCommand('setContext', 'terraform.showModuleView', true);
    } catch (error) {
      reporter.sendTelemetryException(error);
    }
  }

  // export public API
  return { handler: clientHandler, moduleCallers };
}

export function deactivate(): Promise<void> {
  return clientHandler.stopClients();
}

async function updateTerraformStatusBar(documentUri: vscode.Uri) {
  const initSupported = clientHandler.clientSupportsCommand('terraform-ls.terraform.init');
  if (!initSupported) {
    return;
  }

  const client = clientHandler.getClient();
  if (!client) {
    return;
  }

  try {
    const moduleUri = Utils.dirname(documentUri);
    const response = await moduleCallers(client, moduleUri.toString());
    if (response.moduleCallers.length === 0) {
      const dirName = Utils.basename(moduleUri);
      terraformStatus.text = `$(refresh) ${dirName}`;
      terraformStatus.color = new vscode.ThemeColor('statusBar.foreground');
      terraformStatus.tooltip = `Click to run terraform init`;
      terraformStatus.command = 'terraform.initCurrent';
      terraformStatus.show();
    } else {
      terraformStatus.hide();
    }
  } catch (err) {
    vscode.window.showErrorMessage(err);
    reporter.sendTelemetryException(err);
    terraformStatus.hide();
  }
}

async function updateLanguageServer(extVersion: string, clientHandler: ClientHandler, lsPath: ServerPath) {
  outputChannel.appendLine('Checking for language server updates...');
  const hour = 1000 * 60 * 60;
  languageServerUpdater.timeout(function () {
    updateLanguageServer(extVersion, clientHandler, lsPath);
  }, 24 * hour);

  try {
    // skip install if a language server binary path is set
    if (!lsPath.hasCustomBinPath()) {
      const installer = new LanguageServerInstaller(extVersion, lsPath, outputChannel, reporter);
      const install = await installer.needsInstall(
        config('terraform').get('languageServer.requiredVersion', defaultVersionString),
      );
      if (install) {
        await clientHandler.stopClients();
        try {
          await installer.install();
        } catch (err) {
          outputChannel.appendLine(err); // for test failure reporting
          reporter.sendTelemetryException(err);
          throw err;
        } finally {
          await installer.cleanupZips();
        }
      }
    }
    // on repeat runs with no install, this will be a no-op
    return await clientHandler.startClients();
  } catch (error) {
    outputChannel.appendLine(error); // for test failure reporting
    vscode.window.showErrorMessage(error.message);
  }
}

function execWorkspaceCommand(client: LanguageClient, params: ExecuteCommandParams): Promise<any> {
  reporter.sendTelemetryEvent('execWorkspaceCommand', { command: params.command });
  return client.sendRequest(ExecuteCommandRequest.type, params);
}

interface moduleCaller {
  uri: string;
}

interface moduleCallersResponse {
  version: number;
  moduleCallers: moduleCaller[];
}

async function modulesCallersCommand(languageClient: TerraformLanguageClient, moduleUri: string): Promise<any> {
  const requestParams: ExecuteCommandParams = {
    command: `terraform-ls.module.callers`,
    arguments: [`uri=${moduleUri}`],
  };
  return execWorkspaceCommand(languageClient.client, requestParams);
}

async function moduleCallers(
  languageClient: TerraformLanguageClient,
  moduleUri: string,
): Promise<moduleCallersResponse> {
  const response = await modulesCallersCommand(languageClient, moduleUri);
  const moduleCallers: moduleCaller[] = response.callers;

  return { version: response.v, moduleCallers };
}

async function terraformCommand(
  command: string,
  languageServerExec = true,
  clientHandler: ClientHandler,
): Promise<any> {
  const textEditor = getActiveTextEditor();
  if (textEditor) {
    const languageClient = clientHandler.getClient();

    const moduleUri = Utils.dirname(textEditor.document.uri);
    const response = await moduleCallers(languageClient, moduleUri.toString());

    let selectedModule: string;
    if (response.moduleCallers.length > 1) {
      const selected = await vscode.window.showQuickPick(
        response.moduleCallers.map((m) => m.uri),
        { canPickMany: false },
      );
      selectedModule = selected[0];
    } else if (response.moduleCallers.length == 1) {
      selectedModule = response.moduleCallers[0].uri;
    } else {
      selectedModule = moduleUri.toString();
    }

    if (languageServerExec) {
      const requestParams: ExecuteCommandParams = {
        command: `terraform-ls.terraform.${command}`,
        arguments: [`uri=${selectedModule}`],
      };
      return execWorkspaceCommand(languageClient.client, requestParams);
    } else {
      const terminalName = `Terraform ${selectedModule}`;
      const moduleURI = vscode.Uri.parse(selectedModule);
      const terraformCommand = await vscode.window.showInputBox({
        value: `terraform ${command}`,
        prompt: `Run in ${selectedModule}`,
      });
      if (terraformCommand) {
        const terminal =
          vscode.window.terminals.find((t) => t.name == terminalName) ||
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

function enabled(): boolean {
  return config('terraform').get('languageServer.external');
}
