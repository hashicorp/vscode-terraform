// Copyright (c) The OpenTofu Authors
// SPDX-License-Identifier: MPL-2.0
// Copyright (c) HashiCorp, Inc.
// SPDX-License-Identifier: MPL-2.0

import * as terraform from '../../api/terraform/terraform';
import * as vscode from 'vscode';
import { Utils } from 'vscode-uri';
import { getActiveTextEditor, isTerraformFile } from '../../utils/vscode';
import { LanguageClient } from 'vscode-languageclient/node';

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

  constructor(
    ctx: vscode.ExtensionContext,
    private client: LanguageClient,
  ) {
    ctx.subscriptions.push(
      vscode.commands.registerCommand('terraform.providers.refreshList', () => this.refresh()),
      vscode.window.onDidChangeActiveTextEditor(async () => {
        // most of the time this is called when the user switches tabs or closes the file
        // we already check for state inside the getprovider function, so we can just call refresh here
        this.refresh();
      }),
      vscode.commands.registerCommand('opentofu.providers.openDocumentation', (module: ModuleProviderItem) => {
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

    await vscode.commands.executeCommand('setContext', 'terraform.providers.documentOpened', true);
    await vscode.commands.executeCommand('setContext', 'terraform.providers.documentIsTerraform', true);
    await vscode.commands.executeCommand('setContext', 'terraform.providers.lspConnected', true);
    await vscode.commands.executeCommand('setContext', 'terraform.providers.noResponse', false);
    await vscode.commands.executeCommand('setContext', 'terraform.providers.noProviders', false);

    if (activeEditor?.document === undefined) {
      // there is no open document
      await vscode.commands.executeCommand('setContext', 'terraform.providers.documentOpened', false);
      return [];
    }

    if (!isTerraformFile(activeEditor.document)) {
      // the open file is not a terraform file
      await vscode.commands.executeCommand('setContext', 'terraform.providers.documentIsTerraform', false);
      return [];
    }

    if (this.client === undefined) {
      // connection to terraform-ls failed
      await vscode.commands.executeCommand('setContext', 'terraform.providers.lspConnected', false);
      return [];
    }

    const editor = activeEditor.document.uri;
    const documentURI = Utils.dirname(editor);

    let response: terraform.ModuleProvidersResponse;
    try {
      response = await terraform.moduleProviders(documentURI.toString(), this.client);
      if (response === null) {
        // no response from terraform-ls
        await vscode.commands.executeCommand('setContext', 'terraform.providers.noResponse', true);
        return [];
      }
    } catch {
      // error from terraform-ls
      await vscode.commands.executeCommand('setContext', 'terraform.providers.noResponse', true);
      return [];
    }

    try {
      const list = Object.entries(response.provider_requirements).map(
        ([provider, details]) =>
          new ModuleProviderItem(
            provider,
            details.display_name,
            details.version_constraint,
            response.installed_providers[provider],
            details.docs_link,
          ),
      );

      if (list.length === 0) {
        await vscode.commands.executeCommand('setContext', 'terraform.providers.noProviders', true);
      }

      return list;
    } catch {
      // error mapping response
      await vscode.commands.executeCommand('setContext', 'terraform.providers.noResponse', true);
      return [];
    }
  }
}
