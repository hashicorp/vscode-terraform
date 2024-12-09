/**
 * Copyright (c) HashiCorp, Inc.
 * SPDX-License-Identifier: MPL-2.0
 */

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
import { ModuleCallsDataProvider } from './providers/terraform/moduleCalls';
import { ModuleProvidersDataProvider } from './providers/terraform/moduleProviders';
import { ServerPath } from './utils/serverPath';
import { config, handleLanguageClientStartError } from './utils/vscode';
import { TelemetryFeature } from './features/telemetry';
import { ShowReferencesFeature } from './features/showReferences';
import { CustomSemanticTokens } from './features/semanticTokens';
import { ModuleProvidersFeature } from './features/moduleProviders';
import { ModuleCallsFeature } from './features/moduleCalls';
import { TerraformVersionFeature } from './features/terraformVersion';
import { LanguageStatusFeature } from './features/languageStatus';
import { getInitializationOptions } from './settings';
import { TerraformLSCommands } from './commands/terraformls';
import { TerraformCommands } from './commands/terraform';
import * as lsStatus from './status/language';
import { TerraformCloudFeature } from './features/terraformCloud';
import { setupMockServer, stopMockServer } from './test/e2e/specs/mocks/server';

const id = 'terraform';
const brand = `HashiCorp Terraform`;
const documentSelector: DocumentSelector = [
  { scheme: 'file', language: 'terraform' },
  { scheme: 'file', language: 'terraform-vars' },
  { scheme: 'file', language: 'terraform-stack' },
  { scheme: 'file', language: 'terraform-deploy' },
  { scheme: 'file', language: 'terraform-test' },
  { scheme: 'file', language: 'terraform-mock' },
];
const outputChannel = vscode.window.createOutputChannel(brand);
const tfcOutputChannel = vscode.window.createOutputChannel('HCP Terraform');

let reporter: TelemetryReporter;
let client: LanguageClient;
let initializationError: ResponseError<InitializeError> | Error | undefined = undefined;
let crashCount = 0;

export async function activate(context: vscode.ExtensionContext): Promise<void> {
  if (process.env.HASHI_CODE_TEST === 'true') {
    setupMockServer();
  }

  const manifest = context.extension.packageJSON;
  reporter = new TelemetryReporter(manifest.appInsightsKey);
  context.subscriptions.push(reporter);

  // always register commands needed to control terraform-ls
  context.subscriptions.push(new TerraformLSCommands(context));

  context.subscriptions.push(new TerraformCloudFeature(context, reporter, tfcOutputChannel));

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
    progressOnInitialization: true,
    synchronize: {
      fileEvents: [
        vscode.workspace.createFileSystemWatcher('**/*.tf'),
        vscode.workspace.createFileSystemWatcher('**/*.tfvars'),
        vscode.workspace.createFileSystemWatcher('**/*.tfstack.hcl'),
        vscode.workspace.createFileSystemWatcher('**/*.tfdeploy.hcl'),
        vscode.workspace.createFileSystemWatcher('**/*.tftest.hcl'),
        vscode.workspace.createFileSystemWatcher('**/*.tfmock.hcl'),
      ],
    },
    diagnosticCollectionName: 'HashiCorpTerraform',
    outputChannel: outputChannel,
    revealOutputChannelOn: RevealOutputChannelOn.Never,
    initializationOptions: initializationOptions,
    initializationFailedHandler: (error: ResponseError<InitializeError> | Error) => {
      initializationError = error;

      reporter.sendTelemetryErrorEvent('initializationError', {
        message: error.message,
        stack: error.stack,
        code: error instanceof ResponseError ? error.code.toString() : undefined,
      });

      let msg = 'Failure to start terraform-ls. Please check your configuration settings and reload this window';

      const serverArgs = config('terraform').get<string[]>('languageServer.args', []);
      if (serverArgs[0] !== 'serve') {
        msg =
          'You need at least a "serve" argument in the `terraform.languageServer.args` setting. Please check your configuration settings and reload this window';
      }

      outputChannel.appendLine(msg);

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
      error: (error: Error, message: Message, count: number) => {
        return {
          message: `Terraform LS connection error: (${count})\n${error.message}\n${message.jsonrpc}`,
          action: ErrorAction.Shutdown,
        };
      },
      closed: () => {
        if (initializationError !== undefined) {
          // this error is being handled by initializationHandler
          outputChannel.appendLine('Initialization error handled by handler');
          return {
            // this will log an empty line in outputchannel
            // but not pop an error dialog to user so we can
            // pop a custom error later
            message: '',
            action: CloseAction.DoNotRestart,
          };
        }

        // restart at least once in order for initializationError to be populated
        crashCount = crashCount + 1;
        if (crashCount <= 1) {
          outputChannel.appendLine('Server has failed. Restarting');
          return {
            // message: '', // suppresses error popups
            action: CloseAction.Restart,
          };
        }

        // this is not an intialization error, so we don't know what went wrong yet
        // write to log and stop attempting to restart server
        // initializationFailedHandler will handle showing an error to user
        outputChannel.appendLine(
          'Failure to start terraform-ls. Please check your configuration settings and reload this window',
        );
        return {
          message: 'Failure to start terraform-ls. Please check your configuration settings and reload this window',
          action: CloseAction.DoNotRestart,
        };
      },
    },
  };

  client = new LanguageClient(id, serverOptions, clientOptions);
  client.onDidChangeState((event) => {
    outputChannel.appendLine(`Client: ${State[event.oldState]} --> ${State[event.newState]}`);
    switch (event.newState) {
      case State.Starting:
        lsStatus.setLanguageServerStarting();
        break;
      case State.Running:
        lsStatus.setLanguageServerRunning();
        break;
      case State.Stopped:
        lsStatus.setLanguageServerStopped();
        reporter.sendTelemetryEvent('stopClient');
        break;
    }
  });

  client.registerFeatures([
    new LanguageStatusFeature(client, reporter, outputChannel),
    new CustomSemanticTokens(client, manifest),
    new ModuleProvidersFeature(context, client, new ModuleProvidersDataProvider(context, client, reporter)),
    new ModuleCallsFeature(context, client, new ModuleCallsDataProvider(context, client, reporter)),
    new TelemetryFeature(context, client, reporter),
    new ShowReferencesFeature(client),
    new TerraformVersionFeature(context, client, reporter, outputChannel),
  ]);

  // these need the LS to function, so are only registered if enabled
  context.subscriptions.push(new GenerateBugReportCommand(context), new TerraformCommands(client, reporter, context));

  try {
    await client.start();
  } catch (error) {
    await handleLanguageClientStartError(error, context, reporter);
  }
}

export async function deactivate(): Promise<void> {
  try {
    await client.stop();
  } catch (error) {
    if (error instanceof Error) {
      outputChannel.appendLine(error.message);
      reporter.sendTelemetryErrorEvent('deactivate', {
        message: error.message,
        stack: error.stack,
      });
      vscode.window.showErrorMessage(error.message);
      lsStatus.setLanguageServerState(error.message, false, vscode.LanguageStatusSeverity.Error);
    } else if (typeof error === 'string') {
      outputChannel.appendLine(error);
      reporter.sendTelemetryErrorEvent('deactivate', {
        message: error,
      });
      vscode.window.showErrorMessage(error);
      lsStatus.setLanguageServerState(error, false, vscode.LanguageStatusSeverity.Error);
    }
  }

  if (process.env.HASHI_CODE_TEST === 'true') {
    stopMockServer();
  }
}
