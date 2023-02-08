import * as vscode from 'vscode';
import TelemetryReporter from '@vscode/extension-telemetry';
import {
  CloseAction,
  DocumentSelector,
  ErrorAction,
  InitializeError,
  LanguageClient,
  LanguageClientOptions,
  Message,
  ResponseError,
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
let initializationError: ResponseError<InitializeError> | undefined = undefined;
let crashCount = 0;

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

  const clientOptions: LanguageClientOptions = {
    documentSelector: documentSelector,
    synchronize: {
      fileEvents: [
        vscode.workspace.createFileSystemWatcher('**/*.tf'),
        vscode.workspace.createFileSystemWatcher('**/*.tfvars'),
      ],
    },
    outputChannel: outputChannel,
    revealOutputChannelOn: RevealOutputChannelOn.Never,
    initializationOptions: initializationOptions,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    initializationFailedHandler: (error: ResponseError<InitializeError> | Error | any) => {
      initializationError = error;

      reporter.sendTelemetryException(error);

      let msg = 'Failure to start terraform-ls. Please check your configuration settings and reload this window';

      const serverArgs = config('terraform').get<string[]>('languageServer.args', []);
      if (serverArgs[0] !== 'serve') {
        msg =
          'You need at least a "serve" argument in the `terraform.languageServer.args` setting. Please check your configuration settings and reload this window';
      }

      vscode.window
        .showErrorMessage(
          msg,
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

      return false;
    },
    errorHandler: {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      error: (_error: Error, _message: Message, _count: number) => {
        return {
          message: '', // this ensures duplicate message windows are not raised
          action: ErrorAction.Shutdown,
        };
      },
      closed: () => {
        if (initializationError !== undefined) {
          // this error is being handled by initializationHandler
          return {
            message: '',
            action: CloseAction.DoNotRestart,
          };
        }

        // restart at least once in order for initializationError to be populated
        crashCount = crashCount + 1;
        if (crashCount <= 1) {
          return {
            message: '', // suppresses error popups
            action: CloseAction.Restart,
          };
        }

        // this is not an intialization error, so we don't know what went wrong yet
        return {
          message: 'Failure to start terraform-ls. Please check your configuration settings and reload this window',
          action: CloseAction.DoNotRestart,
        };
      },
    },
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

  try {
    console.log('Starting client');

    await client.start();

    reporter.sendTelemetryEvent('startClient');

    const initializeResult = client.initializeResult;
    if (initializeResult !== undefined) {
      const multiFoldersSupported = initializeResult.capabilities.workspace?.workspaceFolders?.supported;
      console.log(`Multi-folder support: ${multiFoldersSupported}`);
    }
  } catch (error) {
    await handleLanguageClientStartError(error, context, reporter);
  }
}

export async function deactivate(): Promise<void> {
  try {
    await client?.stop();
  } catch (error) {
    console.log(error); // for test failure reporting
    if (error instanceof Error) {
      reporter.sendTelemetryException(error);
      vscode.window.showErrorMessage(error.message);
    } else if (typeof error === 'string') {
      reporter.sendTelemetryException(new Error(error));
      vscode.window.showErrorMessage(error);
    }
  }
}
