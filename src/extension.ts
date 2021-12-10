import * as vscode from 'vscode';
import TelemetryReporter from 'vscode-extension-telemetry';
import { ExecuteCommandParams, ExecuteCommandRequest } from 'vscode-languageclient';
import { LanguageClient } from 'vscode-languageclient/node';
import { Utils } from 'vscode-uri';
import { ClientHandler, TerraformLanguageClient } from './clientHandler';
import { GenerateBugReportCommand } from './commands/generateBugReport';
import { DEFAULT_LS_VERSION, isValidVersionString } from './installer/detector';
import { updateOrInstall } from './installer/updater';
import { ModuleCallsDataProvider } from './providers/moduleCalls';
import { ModuleProvidersDataProvider } from './providers/moduleProviders';
import { ServerPath } from './serverPath';
import { SingleInstanceTimeout } from './utils';
import { config, getActiveTextEditor } from './vscodeUtils';

const brand = `HashiCorp Terraform`;
const outputChannel = vscode.window.createOutputChannel(brand);
export let terraformStatus: vscode.StatusBarItem;

let reporter: TelemetryReporter;
let clientHandler: ClientHandler;
const languageServerUpdater = new SingleInstanceTimeout();

export async function activate(context: vscode.ExtensionContext): Promise<void> {
  const manifest = context.extension.packageJSON;
  terraformStatus = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 0);
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
      const error = err instanceof Error ? err.message : err;
      console.error(`Error trying to erase pre-2.0.0 settings: ${error}`);
    }
  }

  if (config('terraform').has('languageServer.requiredVersion')) {
    const langServerVer = config('terraform').get('languageServer.requiredVersion', DEFAULT_LS_VERSION);
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
      await updateLanguageServer(manifest.version, lsPath);
      return clientHandler.startClient();
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
      return clientHandler.stopClient();
    }),
    vscode.commands.registerCommand('terraform.apply', async () => {
      await terraformCommand('apply', false);
    }),
    vscode.commands.registerCommand('terraform.init', async () => {
      const workspaceFolders = vscode.workspace.workspaceFolders;
      const selected = await vscode.window.showOpenDialog({
        canSelectFiles: false,
        canSelectFolders: true,
        canSelectMany: false,
        defaultUri: workspaceFolders ? workspaceFolders[0]?.uri : undefined,
        openLabel: 'Initialize',
      });
      const client = clientHandler.getClient();
      if (selected && client) {
        const moduleUri = selected[0];
        const requestParams: ExecuteCommandParams = {
          command: `${client.commandPrefix}.terraform-ls.terraform.init`,
          arguments: [`uri=${moduleUri}`],
        };
        await execWorkspaceCommand(client.client, requestParams);
      }
    }),
    vscode.commands.registerCommand('terraform.initCurrent', async () => {
      await terraformCommand('init', true);
    }),
    vscode.commands.registerCommand('terraform.plan', async () => {
      await terraformCommand('plan', false);
    }),
    vscode.commands.registerCommand('terraform.validate', async () => {
      await terraformCommand('validate', true);
    }),
    new GenerateBugReportCommand(context),
    vscode.window.registerTreeDataProvider('terraform.modules', new ModuleCallsDataProvider(context, clientHandler)),
    vscode.window.registerTreeDataProvider(
      'terraform.providers',
      new ModuleProvidersDataProvider(context, clientHandler),
    ),
    vscode.workspace.onDidChangeConfiguration(async (event: vscode.ConfigurationChangeEvent) => {
      if (event.affectsConfiguration('terraform') || event.affectsConfiguration('terraform-ls')) {
        const reloadMsg = 'Reload VSCode window to apply language server changes';
        const selected = await vscode.window.showInformationMessage(reloadMsg, 'Reload');
        if (selected === 'Reload') {
          vscode.commands.executeCommand('workbench.action.reloadWindow');
        }
      }
    }),
    vscode.window.onDidChangeVisibleTextEditors(async (editors: readonly vscode.TextEditor[]) => {
      const textEditor = editors.find((ed) => !!ed.viewColumn);
      if (textEditor?.document === undefined) {
        return;
      }
      await updateTerraformStatusBar(textEditor.document.uri);
    }),
  );

  if (enabled()) {
    try {
      await updateLanguageServer(manifest.version, lsPath);
      vscode.commands.executeCommand('setContext', 'terraform.showTreeViews', true);
    } catch (error) {
      if (error instanceof Error) {
        reporter.sendTelemetryException(error);
      }
    }
  }
}

export async function deactivate(): Promise<void> {
  if (clientHandler === undefined) {
    return;
  }

  return clientHandler.stopClient();
}

export async function updateTerraformStatusBar(documentUri: vscode.Uri): Promise<void> {
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
    const response = await moduleCallers(moduleUri.toString());

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

async function updateLanguageServer(extVersion: string, lsPath: ServerPath, scheduled = false) {
  if (config('extensions').get<boolean>('autoCheckUpdates', true) === true) {
    console.log('Scheduling check for language server updates...');
    const hour = 1000 * 60 * 60;
    languageServerUpdater.timeout(function () {
      updateLanguageServer(extVersion, lsPath, true);
    }, 24 * hour);
  }

  if (lsPath.hasCustomBinPath()) {
    // skip install check if user has specified a custom path to the LS
    // with custom paths we *need* to start the lang client always
    await clientHandler.startClient();
    return;
  }

  try {
    await updateOrInstall(
      config('terraform').get('languageServer.requiredVersion', DEFAULT_LS_VERSION),
      extVersion,
      vscode.version,
      lsPath,
      reporter,
    );

    // On scheduled checks, we download to stg and do not replace prod path
    // So we *do not* need to stop or start the LS
    if (scheduled) {
      return;
    }

    // On fresh starts we *need* to start the lang client always
    await clientHandler.startClient();
  } catch (error) {
    console.log(error); // for test failure reporting
    if (error instanceof Error) {
      vscode.window.showErrorMessage(error instanceof Error ? error.message : error);
    } else if (typeof error === 'string') {
      vscode.window.showErrorMessage(error);
    }
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function modulesCallersCommand(languageClient: TerraformLanguageClient, moduleUri: string): Promise<any> {
  const requestParams: ExecuteCommandParams = {
    command: `${languageClient.commandPrefix}.terraform-ls.module.callers`,
    arguments: [`uri=${moduleUri}`],
  };
  return execWorkspaceCommand(languageClient.client, requestParams);
}

export async function moduleCallers(moduleUri: string): Promise<moduleCallersResponse> {
  const client = clientHandler.getClient();
  if (client === undefined) {
    return {
      version: 0,
      moduleCallers: [],
    };
  }

  const response = await modulesCallersCommand(client, moduleUri);
  const moduleCallers: moduleCaller[] = response.callers;

  return { version: response.v, moduleCallers };
}

async function terraformCommand(command: string, languageServerExec = true): Promise<void> {
  const textEditor = getActiveTextEditor();
  if (textEditor) {
    const languageClient = clientHandler.getClient();

    const moduleUri = Utils.dirname(textEditor.document.uri);
    const response = await moduleCallers(moduleUri.toString());

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
    } else if (response.moduleCallers.length == 1) {
      selectedModule = response.moduleCallers[0].uri;
    } else {
      selectedModule = moduleUri.toString();
    }

    if (languageServerExec && languageClient) {
      const requestParams: ExecuteCommandParams = {
        command: `${languageClient.commandPrefix}.terraform-ls.terraform.${command}`,
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
  return config('terraform').get('languageServer.external', false);
}
