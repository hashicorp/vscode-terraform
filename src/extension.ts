import * as terraform from './terraform';
import * as vscode from 'vscode';
import TelemetryReporter from '@vscode/extension-telemetry';
import {
  DocumentSelector,
  LanguageClient,
  LanguageClientOptions,
  RevealOutputChannelOn,
  State,
  StaticFeature,
  CloseAction,
  ErrorAction,
} from 'vscode-languageclient/node';
import { getServerOptions } from './utils/clientHelpers';
import { GenerateBugReportCommand } from './commands/generateBugReport';
import { ModuleCallsDataProvider } from './providers/moduleCalls';
import { ModuleProvidersDataProvider } from './providers/moduleProviders';
import { ServerPath } from './utils/serverPath';
import { config, getScope } from './utils/vscode';
import { TelemetryFeature } from './features/telemetry';
import { ShowReferencesFeature } from './features/showReferences';
import { CustomSemanticTokens } from './features/semanticTokens';
import { ModuleProvidersFeature } from './features/moduleProviders';
import { ModuleCallsFeature } from './features/moduleCalls';
import { getInitializationOptions, migrateLegacySettings, previewExtensionPresent } from './settings';

const id = 'terraform';
const brand = `HashiCorp Terraform`;
const documentSelector: DocumentSelector = [
  { scheme: 'file', language: 'terraform' },
  { scheme: 'file', language: 'terraform-vars' },
];
export const outputChannel = vscode.window.createOutputChannel(brand);

let reporter: TelemetryReporter;
let client: LanguageClient;

export async function activate(context: vscode.ExtensionContext): Promise<void> {
  const manifest = context.extension.packageJSON;
  reporter = new TelemetryReporter(context.extension.id, manifest.version, manifest.appInsightsKey);
  context.subscriptions.push(reporter);

  if (previewExtensionPresent(context.extension.id)) {
    reporter.sendTelemetryEvent('previewExtensionPresentWithStable');
    return undefined;
  }

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
  );

  if (config('terraform').get<boolean>('languageServer.enable') === false) {
    reporter.sendTelemetryEvent('disabledTerraformLS');
    return;
  }

  const lsPath = new ServerPath(context);
  if (lsPath.hasCustomBinPath()) {
    reporter.sendTelemetryEvent('usePathToBinary');
  }
  const serverOptions = await getServerOptions(lsPath);

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
    errorHandler: {
      error: (error, message, count) => {
        vscode.window.showErrorMessage(
          `Terraform LS connection error: (${count})\n${error.message}\n${message?.jsonrpc}`,
        );

        return ErrorAction.Continue;
      },
      closed: () => {
        outputChannel.appendLine(
          `Failure to start terraform-ls. Please check your configuration settings and reload this window`,
        );

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
                break;
              case 'Open Settings':
                await vscode.commands.executeCommand('workbench.action.openSettings', '@ext:hashicorp.terraform');
                break;
              case 'More Info':
                await vscode.commands.executeCommand(
                  'vscode.open',
                  vscode.Uri.parse('https://github.com/hashicorp/vscode-terraform#troubleshooting'),
                );
                break;
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

  const moduleProvidersDataProvider = new ModuleProvidersDataProvider(context, client, reporter);
  const moduleCallsDataProvider = new ModuleCallsDataProvider(context, client, reporter);

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

  // these need the LS to function, so are only registered if enabled
  context.subscriptions.push(
    vscode.commands.registerCommand('terraform.init', async () => {
      await terraform.initAskUserCommand(client, reporter);
    }),
    vscode.commands.registerCommand('terraform.initCurrent', async () => {
      await terraform.initCurrentOpenFileCommand(client, reporter);
    }),
    vscode.commands.registerCommand('terraform.apply', async () => {
      await terraform.command('apply', client, reporter, true);
    }),
    vscode.commands.registerCommand('terraform.plan', async () => {
      await terraform.command('plan', client, reporter, true);
    }),
    vscode.commands.registerCommand('terraform.validate', async () => {
      await terraform.command('validate', client, reporter);
    }),
    vscode.window.registerTreeDataProvider('terraform.modules', moduleCallsDataProvider),
    vscode.window.registerTreeDataProvider('terraform.providers', moduleProvidersDataProvider),
  );

  await startLanguageServer(context);
}

export async function deactivate(): Promise<void> {
  if (client === undefined) {
    return;
  }

  return client.stop();
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
