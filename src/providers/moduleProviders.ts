import * as vscode from 'vscode';
import { Utils } from 'vscode-uri';
import { ExecuteCommandParams, ExecuteCommandRequest } from 'vscode-languageclient';

import { ClientHandler } from '../clientHandler';
import { getActiveTextEditor, isTerraformFile } from '../utils/vscodeUtils';

/* eslint-disable @typescript-eslint/naming-convention */
interface ModuleProvidersResponse {
  v: number;
  provider_requirements: {
    [provider: string]: {
      display_name: string;
      version_constraint?: string;
      docs_link?: string;
    };
  };
  installed_providers: {
    [provider: string]: string;
  };
}
/* eslint-enable @typescript-eslint/naming-convention */

class ModuleProviderItem extends vscode.TreeItem {
  constructor(
    public fullName: string,
    public displayName: string,
    public requiredVersion: string | undefined,
    public installedVersion: string | undefined,
    public docsLink: string | undefined,
  ) {
    super(displayName, vscode.TreeItemCollapsibleState.None);

    this.description = installedVersion ?? '';
    this.iconPath = new vscode.ThemeIcon('package');
    this.tooltip = `${fullName} ${requiredVersion ?? ''}`;

    if (docsLink) {
      this.contextValue = 'moduleProviderHasDocs';
    }
  }
}

export class ModuleProvidersDataProvider implements vscode.TreeDataProvider<ModuleProviderItem> {
  private readonly didChangeTreeData = new vscode.EventEmitter<void | ModuleProviderItem>();
  public readonly onDidChangeTreeData = this.didChangeTreeData.event;

  constructor(ctx: vscode.ExtensionContext, private handler: ClientHandler) {
    ctx.subscriptions.push(
      vscode.commands.registerCommand('terraform.providers.refreshList', () => this.refresh()),
      vscode.window.onDidChangeActiveTextEditor(async (event: vscode.TextEditor | undefined) => {
        const activeEditor = getActiveTextEditor();

        if (!isTerraformFile(activeEditor?.document)) {
          return;
        }

        if (event && activeEditor) {
          this.refresh();
        }
      }),
      vscode.commands.registerCommand('terraform.providers.openDocumentation', (module: ModuleProviderItem) => {
        if (module.docsLink) {
          vscode.env.openExternal(vscode.Uri.parse(module.docsLink));
        }
      }),
    );
  }

  refresh(): void {
    this.didChangeTreeData.fire();
  }

  getTreeItem(element: ModuleProviderItem): vscode.TreeItem | Thenable<vscode.TreeItem> {
    return element;
  }

  getChildren(element?: ModuleProviderItem): vscode.ProviderResult<ModuleProviderItem[]> {
    if (element) {
      return [];
    } else {
      return this.getProvider();
    }
  }

  async getProvider(): Promise<ModuleProviderItem[]> {
    const activeEditor = getActiveTextEditor();

    if (activeEditor?.document === undefined) {
      return [];
    }

    if (!isTerraformFile(activeEditor.document)) {
      return [];
    }

    const editor = activeEditor.document.uri;
    const documentURI = Utils.dirname(editor);
    const handler = this.handler.getClient();
    if (handler === undefined) {
      return [];
    }
    await handler.client.onReady();

    const moduleCallsSupported = this.handler.clientSupportsCommand(
      `${handler.commandPrefix}.terraform-ls.module.providers`,
    );
    if (!moduleCallsSupported) {
      return [];
    }

    const params: ExecuteCommandParams = {
      command: `${handler.commandPrefix}.terraform-ls.module.providers`,
      arguments: [`uri=${documentURI}`],
    };

    const response = await handler.client.sendRequest<ExecuteCommandParams, ModuleProvidersResponse, void>(
      ExecuteCommandRequest.type,
      params,
    );
    if (response === null) {
      return [];
    }

    return Object.entries(response.provider_requirements)
      .map(
        ([provider, details]) =>
          new ModuleProviderItem(
            provider,
            details.display_name,
            details.version_constraint,
            response.installed_providers[provider],
            details.docs_link,
          ),
      )
      .filter((m) => Boolean(m.requiredVersion));
  }
}
