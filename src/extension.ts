import * as vscode from 'vscode';
import TelemetryReporter from '@vscode/extension-telemetry';
import { ExecuteCommandParams } from 'vscode-languageclient';
import { ClientHandler } from './clientHandler';
import { GenerateBugReportCommand } from './commands/generateBugReport';
import { ModuleCallsDataProvider } from './providers/moduleCalls';
import { ModuleProvidersDataProvider } from './providers/moduleProviders';
import { ServerPath } from './serverPath';
import { config, isTerraformFile } from './vscodeUtils';
import { execWorkspaceCommand, terraformCommand, updateTerraformStatusBar } from './commands/terraformCommands';

const brand = `HashiCorp Terraform`;
const outputChannel = vscode.window.createOutputChannel(brand);

let reporter: TelemetryReporter;
let clientHandler: ClientHandler;

export async function activate(context: vscode.ExtensionContext): Promise<void> {
  const manifest = context.extension.packageJSON;
  reporter = new TelemetryReporter(context.extension.id, manifest.version, manifest.appInsightsKey);
  context.subscriptions.push(reporter);

  const stable = vscode.extensions.getExtension('hashicorp.terraform');
  const preview = vscode.extensions.getExtension('hashicorp.terraform-preview');

  if (context.extension.id === 'hashicorp.terraform-preview') {
    if (stable !== undefined) {
      vscode.window.showErrorMessage(
        'Terraform Preview cannot be used while Terraform Stable is also enabled. Please ensure only one is enabled or installed and reload this window',
      );
      return undefined;
    }
  } else if (context.extension.id === 'hashicorp.terraform') {
    if (preview !== undefined) {
      vscode.window.showErrorMessage(
        'Terraform Stable cannot be used while Terraform Preview is also enabled. Please ensure only one is enabled or installed and reload this window',
      );
      return undefined;
    }
  }

  const lsPath = new ServerPath(context);
  clientHandler = new ClientHandler(lsPath, outputChannel, reporter);
  clientHandler.extSemanticTokenTypes = tokenTypesFromExtManifest(manifest);
  clientHandler.extSemanticTokenModifiers = tokenModifiersFromExtManifest(manifest);

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
      return startLanguageServer();
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
      return stopLanguageServer();
    }),
    vscode.commands.registerCommand('terraform.apply', async () => {
      await terraformCommand('apply', clientHandler, reporter, false);
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
        await execWorkspaceCommand(client.client, requestParams, reporter);
      }
    }),
    vscode.commands.registerCommand('terraform.initCurrent', async () => {
      await terraformCommand('init', clientHandler, reporter, true);
    }),
    vscode.commands.registerCommand('terraform.plan', async () => {
      await terraformCommand('plan', clientHandler, reporter, false);
    }),
    vscode.commands.registerCommand('terraform.validate', async () => {
      await terraformCommand('validate', clientHandler, reporter, true);
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

      if (!isTerraformFile(textEditor.document)) {
        return;
      }

      await updateTerraformStatusBar(textEditor.document.uri, clientHandler, reporter);
    }),
  );

  if (enabled()) {
    await startLanguageServer();
  }
}

export async function deactivate(): Promise<void> {
  if (clientHandler === undefined) {
    return;
  }

  return clientHandler.stopClient();
}

async function startLanguageServer() {
  try {
    await clientHandler.startClient();
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
    await clientHandler.stopClient();
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

interface PartialManifest {
  contributes: {
    semanticTokenTypes?: ObjectWithId[];
    semanticTokenModifiers?: ObjectWithId[];
  };
}

interface ObjectWithId {
  id: string;
}

function tokenTypesFromExtManifest(manifest: PartialManifest): string[] {
  if (!manifest.contributes.semanticTokenTypes) {
    return [];
  }
  return manifest.contributes.semanticTokenTypes.map((token: ObjectWithId) => token.id);
}

function tokenModifiersFromExtManifest(manifest: PartialManifest): string[] {
  if (!manifest.contributes.semanticTokenModifiers) {
    return [];
  }

  return manifest.contributes.semanticTokenModifiers.map((modifier: ObjectWithId) => modifier.id);
}

function enabled(): boolean {
  return config('terraform').get('languageServer.external', false);
}
