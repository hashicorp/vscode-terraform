import * as vscode from 'vscode';
import TelemetryReporter from '@vscode/extension-telemetry';
import {
  DocumentSelector,
  ExecuteCommandParams,
  ExecuteCommandRequest,
  LanguageClient,
  LanguageClientOptions,
  RevealOutputChannelOn,
  State,
  StaticFeature,
  ServerOptions,
} from 'vscode-languageclient/node';
import { Utils } from 'vscode-uri';
import { clientSupportsCommand, getInitializationOptions, getServerExecutable } from './utils/clientHelpers';
import { GenerateBugReportCommand } from './commands/generateBugReport';
import { ModuleCallsDataProvider } from './providers/moduleCalls';
import { ModuleProvidersDataProvider } from './providers/moduleProviders';
import { ServerPath } from './utils/serverPath';
import { config, getActiveTextEditor, getScope, isTerraformFile, LanguageServerSettings } from './utils/vscode';
import { TelemetryFeature } from './features/telemetry';
import { ShowReferencesFeature } from './features/showReferences';
import { CustomSemanticTokens } from './features/semanticTokens';
import { ModuleProvidersFeature } from './features/moduleProviders';
import { ModuleCallsFeature } from './features/moduleCalls';

const id = 'terraform';
const brand = `HashiCorp Terraform`;
const documentSelector: DocumentSelector = [
  { scheme: 'file', language: 'terraform' },
  { scheme: 'file', language: 'terraform-vars' },
];
const outputChannel = vscode.window.createOutputChannel(brand);
export let terraformStatus: vscode.StatusBarItem;

let reporter: TelemetryReporter;
let client: LanguageClient;

export async function activate(context: vscode.ExtensionContext): Promise<void> {
  const manifest = context.extension.packageJSON;
  terraformStatus = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 0);
  reporter = new TelemetryReporter(context.extension.id, manifest.version, manifest.appInsightsKey);
  context.subscriptions.push(reporter);

  if (previewExtensionPresent(context.extension.id)) {
    reporter.sendTelemetryEvent('previewExtensionPresentWithStable');
    return undefined;
  }

  // get rid of pre-2.0.0 settings
  await migrateLegacySettings();

  // Subscriptions
  context.subscriptions.push(
    new GenerateBugReportCommand(context),
    vscode.commands.registerCommand('terraform.enableLanguageServer', async () => {
      if (config('terraform').get('languageServer.external') === true) {
        return startLanguageServer(context);
      }

      const current: LanguageServerSettings = config('terraform').get<LanguageServerSettings>('languageServer', {
        external: true,
        pathToBinary: '',
        args: ['serve'],
        ignoreSingleFileWarning: false,
      });
      const newValue = Object.assign(current, { external: true });

      const scope: vscode.ConfigurationTarget = getScope('terraform', 'languageServer');

      await config('terraform').update('languageServer', newValue, scope);
    }),
    vscode.commands.registerCommand('terraform.disableLanguageServer', async () => {
      if (config('terraform').get('languageServer.external') === false) {
        return stopLanguageServer();
      }

      const current: LanguageServerSettings = config('teraform').get<LanguageServerSettings>('languageServer', {
        external: true,
        pathToBinary: '',
        args: ['serve'],
        ignoreSingleFileWarning: false,
      });
      const newValue = Object.assign(current, { external: false });

      const scope: vscode.ConfigurationTarget = getScope('terraform', 'languageServer');

      await config('terraform').update('languageServer', newValue, scope);
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
    vscode.commands.registerCommand('terraform.apply', async () => {
      await terraformCommand('apply');
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
  );

  if (!enabled()) {
    reporter.sendTelemetryEvent('disabledTerraformLS');
    return;
  }

  const lsPath = new ServerPath(context);
  if (lsPath.hasCustomBinPath()) {
    reporter.sendTelemetryEvent('usePathToBinary');
  }
  const executable = await getServerExecutable(lsPath);
  const serverOptions: ServerOptions = {
    run: executable,
    debug: executable,
  };
  outputChannel.appendLine(`Launching language server: ${executable.command} ${executable.args?.join(' ')}`);

  const initializationOptions = getInitializationOptions();
  const clientOptions: LanguageClientOptions = {
    documentSelector: documentSelector,
    synchronize: {
      fileEvents: [
        vscode.workspace.createFileSystemWatcher('**/*.tf'),
        vscode.workspace.createFileSystemWatcher('**/*.tfvars'),
      ],
    },
    initializationOptions: initializationOptions,
    initializationFailedHandler: (error) => {
      reporter.sendTelemetryException(error);
      return false;
    },
    outputChannel: outputChannel,
    revealOutputChannelOn: RevealOutputChannelOn.Never,
  };

  client = new LanguageClient(id, serverOptions, clientOptions);
  client.onDidChangeState((event) => {
    console.log(`Client: ${State[event.oldState]} --> ${State[event.newState]}`);
    if (event.newState === State.Stopped) {
      reporter.sendTelemetryEvent('stopClient');
    }
  });

  const moduleProvidersDataProvider = new ModuleProvidersDataProvider(context, client);
  const moduleCallsDataProvider = new ModuleCallsDataProvider(context, client);

  const features: StaticFeature[] = [
    new CustomSemanticTokens(client, manifest),
    new ModuleProvidersFeature(client, moduleProvidersDataProvider),
    new ModuleCallsFeature(client, moduleCallsDataProvider),
  ];
  if (vscode.env.isTelemetryEnabled) {
    features.push(new TelemetryFeature(client, reporter));
  }
  const codeLensReferenceCount = config('terraform').get<boolean>('codelens.referenceCount');
  if (codeLensReferenceCount) {
    features.push(new ShowReferencesFeature(client));
  }

  client.registerFeatures(features);

  await startLanguageServer(context);

  // these need the LS to function, so are only registered if enabled
  context.subscriptions.push(
    vscode.commands.registerCommand('terraform.init', async () => {
      const workspaceFolders = vscode.workspace.workspaceFolders;
      const selected = await vscode.window.showOpenDialog({
        canSelectFiles: false,
        canSelectFolders: true,
        canSelectMany: false,
        defaultUri: workspaceFolders ? workspaceFolders[0]?.uri : undefined,
        openLabel: 'Initialize',
      });
      if (selected && client) {
        const moduleUri = selected[0];
        const requestParams: ExecuteCommandParams = {
          command: `terraform-ls.terraform.init`,
          arguments: [`uri=${moduleUri}`],
        };
        await execWorkspaceCommand(client, requestParams);
      }
    }),
    vscode.window.registerTreeDataProvider('terraform.modules', moduleCallsDataProvider),
    vscode.window.registerTreeDataProvider('terraform.providers', moduleProvidersDataProvider),
    vscode.window.onDidChangeVisibleTextEditors(async (editors: readonly vscode.TextEditor[]) => {
      const textEditor = editors.find((ed) => !!ed.viewColumn);
      if (textEditor?.document === undefined) {
        return;
      }

      if (!isTerraformFile(textEditor.document)) {
        return;
      }

      await updateTerraformStatusBar(textEditor.document.uri);
    }),
  );
}

export async function deactivate(): Promise<void> {
  if (client === undefined) {
    return;
  }

  return client.stop();
}

export async function updateTerraformStatusBar(documentUri: vscode.Uri): Promise<void> {
  if (client === undefined) {
    return;
  }

  const initSupported = clientSupportsCommand(client.initializeResult, `terraform-ls.terraform.init`);
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

async function startLanguageServer(ctx: vscode.ExtensionContext) {
  try {
    console.log('Starting client');

    ctx.subscriptions.push(client.start());

    await client.onReady();

    reporter.sendTelemetryEvent('startClient');

    const initializeResult = client.initializeResult;
    if (initializeResult !== undefined) {
      const multiFoldersSupported = initializeResult.capabilities.workspace?.workspaceFolders?.supported;
      console.log(`Multi-folder support: ${multiFoldersSupported}`);
    }

    vscode.commands.executeCommand('setContext', 'terraform.showTreeViews', true);
  } catch (error) {
    console.log(error); // for test failure reporting
    if (error instanceof Error) {
      vscode.window.showErrorMessage(error instanceof Error ? error.message : error);
    } else if (typeof error === 'string') {
      vscode.window.showErrorMessage(error);
    }
  }
}

async function stopLanguageServer() {
  try {
    await client?.stop();
    vscode.commands.executeCommand('setContext', 'terraform.showTreeViews', false);
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

interface ModuleCaller {
  uri: string;
}

interface ModuleCallersResponse {
  version: number;
  moduleCallers: ModuleCaller[];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function modulesCallersCommand(languageClient: LanguageClient, moduleUri: string): Promise<any> {
  const requestParams: ExecuteCommandParams = {
    command: `terraform-ls.module.callers`,
    arguments: [`uri=${moduleUri}`],
  };
  return execWorkspaceCommand(languageClient, requestParams);
}

export async function moduleCallers(moduleUri: string): Promise<ModuleCallersResponse> {
  if (client === undefined) {
    return {
      version: 0,
      moduleCallers: [],
    };
  }

  const response = await modulesCallersCommand(client, moduleUri);
  const moduleCallers: ModuleCaller[] = response.callers;

  return { version: response.v, moduleCallers };
}

async function terraformCommand(command: string, languageServerExec = true): Promise<void> {
  const textEditor = getActiveTextEditor();
  if (textEditor) {
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
    } else if (response.moduleCallers.length === 1) {
      selectedModule = response.moduleCallers[0].uri;
    } else {
      selectedModule = moduleUri.toString();
    }

    if (languageServerExec && client) {
      const requestParams: ExecuteCommandParams = {
        command: `terraform-ls.terraform.${command}`,
        arguments: [`uri=${selectedModule}`],
      };
      return execWorkspaceCommand(client, requestParams);
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

function enabled(): boolean {
  return config('terraform').get('languageServer.external', false);
}

async function migrateLegacySettings() {
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
}

function previewExtensionPresent(currentExtensionID: string) {
  const stable = vscode.extensions.getExtension('hashicorp.terraform');
  const preview = vscode.extensions.getExtension('hashicorp.terraform-preview');

  const msg = 'Please ensure only one is enabled or installed and reload this window';

  if (currentExtensionID === 'hashicorp.terraform-preview') {
    if (stable !== undefined) {
      vscode.window.showErrorMessage('Terraform Preview cannot be used while Terraform Stable is also enabled.' + msg);
      return true;
    }
  } else if (currentExtensionID === 'hashicorp.terraform') {
    if (preview !== undefined) {
      vscode.window.showErrorMessage('Terraform Stable cannot be used while Terraform Preview is also enabled.' + msg);
      return true;
    }
  }

  return false;
}
