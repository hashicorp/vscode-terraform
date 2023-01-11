import * as vscode from 'vscode';
import TelemetryReporter from '@vscode/extension-telemetry';
import {
  DocumentSelector,
  LanguageClient,
  LanguageClientOptions,
  RevealOutputChannelOn,
  State,
} from 'vscode-languageclient/node';
import { getServerOptions } from './utils/clientHelpers';
import { GenerateBugReportCommand } from './commands/generateBugReport';
import { ModuleCallsDataProvider } from './providers/moduleCalls';
import { ModuleProvidersDataProvider } from './providers/moduleProviders';
import { ServerPath } from './utils/serverPath';
import { config, handleLanguageClientStartError } from './utils/vscode';
import { TelemetryFeature } from './features/telemetry';
import { ShowReferencesFeature } from './features/showReferences';
import { CustomSemanticTokens } from './features/semanticTokens';
import { ModuleProvidersFeature } from './features/moduleProviders';
import { ModuleCallsFeature } from './features/moduleCalls';
import { getInitializationOptions, migrateLegacySettings, previewExtensionPresent } from './settings';
import { TerraformLSCommands } from './commands/terraformls';
import { TerraformCommands } from './commands/terraform';
import { ExtensionErrorHandler } from './handlers/errorHandler';
import { TerraformVersionFeature } from './features/terraformVersion';

const id = 'terraform';
const brand = `HashiCorp Terraform`;
const documentSelector: DocumentSelector = [
  { scheme: 'file', language: 'terraform' },
  { scheme: 'file', language: 'terraform-vars' },
];
const outputChannel = vscode.window.createOutputChannel(brand);

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

  // always register commands needed to control terraform-ls
  context.subscriptions.push(new TerraformLSCommands());

  if (config('terraform').get<boolean>('languageServer.enable') === false) {
    reporter.sendTelemetryEvent('disabledTerraformLS');
    return;
  }

  const lsPath = new ServerPath(context);
  if (lsPath.hasCustomBinPath()) {
    reporter.sendTelemetryEvent('usePathToBinary');
  }
  const serverOptions = await getServerOptions(lsPath, outputChannel);

  const initializationOptions = getInitializationOptions();

  const errorHandler = new ExtensionErrorHandler(outputChannel, reporter);
  const clientOptions: LanguageClientOptions = {
    documentSelector: documentSelector,
    synchronize: {
      fileEvents: [
        vscode.workspace.createFileSystemWatcher('**/*.tf'),
        vscode.workspace.createFileSystemWatcher('**/*.tfvars'),
      ],
    },
    initializationOptions: initializationOptions,
    initializationFailedHandler: () => {
      return false;
    },
    errorHandler: errorHandler,
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

  client.registerFeatures([
    new CustomSemanticTokens(client, manifest),
    new ModuleProvidersFeature(client, new ModuleProvidersDataProvider(context, client, reporter)),
    new ModuleCallsFeature(client, new ModuleCallsDataProvider(context, client, reporter)),
    new TelemetryFeature(client, reporter),
    new ShowReferencesFeature(client),
    new TerraformVersionFeature(client, reporter, outputChannel),
  ]);

  // these need the LS to function, so are only registered if enabled
  context.subscriptions.push(new GenerateBugReportCommand(context), new TerraformCommands(client, reporter));

  await startLanguageServer(context);
}

export async function deactivate(): Promise<void> {
  stopLanguageServer();
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
    await handleLanguageClientStartError(error, ctx, reporter);
  }
}

async function stopLanguageServer() {
  try {
    await client?.stop();
  } catch (error) {
    console.log(error); // for test failure reporting
    if (error instanceof Error) {
      reporter.sendTelemetryException(error);
      vscode.window.showErrorMessage(error.message);
    } else if (typeof error === 'string') {
      vscode.window.showErrorMessage(error);
      reporter.sendTelemetryException(new Error(error));
    }
  }
}
