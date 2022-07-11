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
  CloseAction,
  ErrorAction,
  Message,
} from 'vscode-languageclient/node';
import { Utils } from 'vscode-uri';
import { clientSupportsCommand, getInitializationOptions, getServerOptions } from './utils/clientHelpers';
import { GenerateBugReportCommand } from './commands/generateBugReport';
import { ModuleCallsDataProvider } from './providers/moduleCalls';
import { ModuleProvidersDataProvider } from './providers/moduleProviders';
import { ServerPath } from './utils/serverPath';
import {
  config,
  deleteSetting,
  getActiveTextEditor,
  getScope,
  isTerraformFile,
  migrate,
  warnIfMigrate,
} from './utils/vscode';
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
export const outputChannel = vscode.window.createOutputChannel(brand);
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

  // migrate pre-2.24.0 settings
  await migrateLegacySettings(context);

  // Subscriptions
  context.subscriptions.push(
    new GenerateBugReportCommand(context),
    vscode.commands.registerCommand('terraform.enableLanguageServer', async () => {
      if (config('terraform').get('languageServer.enable') === true) {
        return startLanguageServer(context);
      }

      const scope: vscode.ConfigurationTarget = getScope('terraform', 'languageServer.enable');

      await config('terraform').update('languageServer.enable', true, scope);
    }),
    vscode.commands.registerCommand('terraform.disableLanguageServer', async () => {
      if (config('terraform').get('languageServer.enable') === false) {
        return stopLanguageServer();
      }

      const scope: vscode.ConfigurationTarget = getScope('terraform', 'languageServer.enable');

      await config('terraform').update('languageServer.enable', false, scope);
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
  const serverOptions = await getServerOptions(lsPath);

  const initializationOptions = getInitializationOptions();

  let restartCount = 0;
  const maxRestartAttempts = 5;
  const restartDelay = 1000;

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
    errorHandler: {
      error: (error: Error, message: Message, count: number) => {
        vscode.window.showErrorMessage(
          `Terraform LS connection error: (${count})\n${error.message}\n${message.jsonrpc}`,
        );

        return ErrorAction.Continue;
      },
      closed: () => {
        restartCount++;
        outputChannel.appendLine(`Connection to terraform-ls failed. Attempting restart ${restartCount}...`);

        if (restartCount < maxRestartAttempts) {
          // wait a second to attempt to start again
          setTimeout(async () => {
            await client.onReady();
            restartCount = 0;
          }, restartDelay);

          // tell VS Code to attempt to restart terraform-ls again
          return CloseAction.Restart;
        }

        vscode.window
          .showErrorMessage(
            'Failure to start terraform-ls. Please check your configuration settings and reload this window',
            {
              detail: '',
              modal: false,
            },
            { title: 'Open Settings' },
            { title: 'Open Logs' },
            { title: 'More Info' },
          )
          .then(async (choice) => {
            if (choice === undefined) {
              return;
            }

            switch (choice.title) {
              case 'Open Logs':
                outputChannel.show();
                return;
              case 'Open Settings':
                await vscode.commands.executeCommand('workbench.action.openSettings', '@ext:hashicorp.terraform');
                return;
              case 'More Info':
                await vscode.commands.executeCommand(
                  'vscode.open',
                  vscode.Uri.parse('https://github.com/hashicorp/vscode-terraform#troubleshooting'),
                );
                return;
              case 'Migrate':
              // migrate below
            }
          });

        // Tell VS Code to stop attempting to start
        return CloseAction.DoNotRestart;
      },
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
  return config('terraform').get('languageServer.enable', false);
}

async function migrateLegacySettings(ctx: vscode.ExtensionContext) {
  // User has asked not to check if settings need to be migrated, so return
  if (ctx.globalState.get('terraform.disableSettingsMigration', false)) {
    return;
  }

  // If any of the following list needs to be migrated, ask user if they want
  // to migrate. This is a blunt force approach, but we don't intend to keep
  // checking this forever
  const warnMigration = warnIfMigrate([
    { section: 'terraform', name: 'languageServer.external' },
    { section: 'terraform', name: 'languageServer.pathToBinary' },
    { section: 'terraform-ls', name: 'rootModules' },
    { section: 'terraform-ls', name: 'excludeRootModules' },
    { section: 'terraform-ls', name: 'ignoreDirectoryNames' },
    { section: 'terraform-ls', name: 'terraformExecPath' },
    { section: 'terraform-ls', name: 'terraformExecTimeout' },
    { section: 'terraform-ls', name: 'terraformLogFilePath' },
    { section: 'terraform-ls', name: 'experimentalFeatures' },
  ]);
  if (warnMigration === false) {
    return;
  }

  const messageText =
    'Automatic migration will change your settings file!' +
    '\n\nTo read more about the this change click "More Info" and delay changing anything';
  // Prompt the user if they want to migrate. If the choose no, then return
  // and they are left to migrate the settings themselves.
  // If they choose yes, then automatically migrate the settings
  // Lastly user can be directed to our README for more information about this
  const choice = await vscode.window.showInformationMessage(
    'Terraform Extension settings have moved in the latest update',
    {
      detail: messageText,
      modal: false,
    },
    { title: 'More Info' },
    { title: 'Migrate' },
    { title: 'Open Settings' },
    { title: 'Suppress' },
  );
  if (choice === undefined) {
    return;
  }

  switch (choice.title) {
    case 'Suppress':
      ctx.globalState.update('terraform.disableSettingsMigration', true);
      return;
    case 'Open Settings':
      await vscode.commands.executeCommand('workbench.action.openSettings', '@ext:hashicorp.terraform');
      return;
    case 'More Info':
      await vscode.commands.executeCommand(
        'vscode.open',
        vscode.Uri.parse('https://github.com/hashicorp/vscode-terraform/blob/v2.24.0/docs/settings-migration.md'),
      );
      await migrateLegacySettings(ctx);
      return;
    case 'Migrate':
    // migrate below
  }

  await migrate('terraform', 'languageServer.external', 'languageServer.enable');
  await migrate('terraform', 'languageServer.pathToBinary', 'languageServer.path');

  // We need to move args and ignoreSingleFileWarning out of the JSON object format
  await migrate('terraform', 'languageServer.args', 'languageServer.args');
  await migrate('terraform', 'languageServer.ignoreSingleFileWarning', 'languageServer.ignoreSingleFileWarning');
  await deleteSetting('terraform', 'languageServer');

  // This simultaneously moves terraform-ls to terraform as well as migrate setting names
  await migrate('terraform-ls', 'rootModules', 'languageServer.rootModules');
  await migrate('terraform-ls', 'excludeRootModules', 'languageServer.excludeRootModules');
  await migrate('terraform-ls', 'ignoreDirectoryNames', 'languageServer.ignoreDirectoryNames');
  await migrate('terraform-ls', 'terraformExecPath', 'languageServer.terraform.path');
  await migrate('terraform-ls', 'terraformExecTimeout', 'languageServer.terraform.timeout');
  await migrate('terraform-ls', 'terraformLogFilePath', 'languageServer.terraform.logFilePath');

  // We need to move prefillRequiredFields and validateOnSave out of the JSON object format as well as
  // move terraform-ls to terraform
  await migrate('terraform-ls', 'experimentalFeatures.validateOnSave', 'experimentalFeatures.validateOnSave');
  await migrate(
    'terraform-ls',
    'experimentalFeatures.prefillRequiredFields',
    'experimentalFeatures.prefillRequiredFields',
  );
  await deleteSetting('terraform-ls', 'experimentalFeatures');
  await vscode.commands.executeCommand('workbench.action.reloadWindow');
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
