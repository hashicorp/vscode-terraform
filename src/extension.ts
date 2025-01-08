// Copyright (c) The OpenTofu Authors
// SPDX-License-Identifier: MPL-2.0
// Copyright (c) HashiCorp, Inc.
// SPDX-License-Identifier: MPL-2.0

import * as vscode from 'vscode';
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

const id = 'opentofu';
const brand = `OpenTofu`;
const documentSelector: DocumentSelector = [
  { scheme: 'file', language: 'terraform' },
  { scheme: 'file', language: 'terraform-vars' },
  { scheme: 'file', language: 'terraform-stack' },
  { scheme: 'file', language: 'terraform-deploy' },
];
const outputChannel = vscode.window.createOutputChannel(brand);

let client: LanguageClient;
let initializationError: ResponseError<InitializeError> | undefined = undefined;
let crashCount = 0;

export async function activate(context: vscode.ExtensionContext): Promise<void> {
  const manifest = context.extension.packageJSON;

  // always register commands needed to control terraform-ls
  context.subscriptions.push(new TerraformLSCommands());

  if (config('opentofu').get<boolean>('languageServer.enable') === false) {
    return;
  }

  const lsPath = new ServerPath(context);

  const serverOptions = await getServerOptions(lsPath, outputChannel);

  const initializationOptions = await getInitializationOptions();

  const clientOptions: LanguageClientOptions = {
    documentSelector: documentSelector,
    progressOnInitialization: true,
    synchronize: {
      fileEvents: [
        vscode.workspace.createFileSystemWatcher('**/*.tf'),
        vscode.workspace.createFileSystemWatcher('**/*.tfvars'),
        vscode.workspace.createFileSystemWatcher('**/*.tfstack.hcl'),
        vscode.workspace.createFileSystemWatcher('**/*.tfdeploy.hcl'),
      ],
    },
    outputChannel: outputChannel,
    revealOutputChannelOn: RevealOutputChannelOn.Never,
    initializationOptions: initializationOptions,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    initializationFailedHandler: (error: ResponseError<InitializeError> | Error | any) => {
      initializationError = error;

      let msg = 'Failure to start opentofu-ls. Please check your configuration settings and reload this window';

      const serverArgs = config('opentofu').get<string[]>('languageServer.args', []);
      if (serverArgs[0] !== 'serve') {
        msg =
          'You need at least a "serve" argument in the `opentofu.languageServer.args` setting. Please check your configuration settings and reload this window';
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
              await vscode.commands.executeCommand('workbench.action.openSettings', '@ext:OpenTofu.tofu');
              break;
            case 'More Info':
              await vscode.commands.executeCommand(
                'vscode.open',
                vscode.Uri.parse('https://github.com/gamunu/vscode-opentofu#troubleshooting'),
              );
              break;
          }
        });

      return false;
    },
    errorHandler: {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      error: (error: Error, message: Message, count: number) => {
        return {
          message: `OpenTofu LS connection error: (${count ?? 0})\n${error?.message}\n${message?.jsonrpc}`,
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
          'Failure to start opentofu-ls. Please check your configuration settings and reload this window',
        );
        return {
          message: 'Failure to start opentofu-ls. Please check your configuration settings and reload this window',
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
        break;
    }
  });

  client.registerFeatures([
    new LanguageStatusFeature(client, outputChannel),
    new CustomSemanticTokens(client, manifest),
    new ModuleProvidersFeature(client, new ModuleProvidersDataProvider(context, client)),
    new ModuleCallsFeature(client, new ModuleCallsDataProvider(context, client)),
    new ShowReferencesFeature(client),
    new TerraformVersionFeature(client, outputChannel),
  ]);

  // these need the LS to function, so are only registered if enabled
  context.subscriptions.push(new GenerateBugReportCommand(context), new TerraformCommands(client));

  try {
    await client.start();
  } catch (error) {
    await handleLanguageClientStartError(error, context);
  }
}

export async function deactivate(): Promise<void> {
  try {
    await client?.stop();
  } catch (error) {
    if (error instanceof Error) {
      outputChannel.appendLine(error.message);
      vscode.window.showErrorMessage(error.message);
      lsStatus.setLanguageServerState(error.message, false, vscode.LanguageStatusSeverity.Error);
    } else if (typeof error === 'string') {
      outputChannel.appendLine(error);
      vscode.window.showErrorMessage(error);
      lsStatus.setLanguageServerState(error, false, vscode.LanguageStatusSeverity.Error);
    }
  }
}
