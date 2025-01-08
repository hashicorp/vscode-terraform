// Copyright (c) The OpenTofu Authors
// SPDX-License-Identifier: MPL-2.0
// Copyright (c) HashiCorp, Inc.
// SPDX-License-Identifier: MPL-2.0

import * as path from 'path';
import * as terraform from '../../api/terraform/terraform';
import * as vscode from 'vscode';
import { LanguageClient } from 'vscode-languageclient/node';
import { Utils } from 'vscode-uri';
import { getActiveTextEditor, isTerraformFile } from '../../utils/vscode';

class ModuleCallItem extends vscode.TreeItem {
  constructor(
    public label: string,
    public sourceAddr: string,
    public version: string | undefined,
    public sourceType: string | undefined,
    public docsLink: string | undefined,
    public terraformIcon: string,
    public readonly children: ModuleCallItem[],
  ) {
    super(
      label,
      children.length >= 1 ? vscode.TreeItemCollapsibleState.Collapsed : vscode.TreeItemCollapsibleState.None,
    );

    this.description = this.version ? `${this.version}` : '';

    if (this.version === undefined) {
      this.tooltip = `${this.sourceAddr}`;
    } else {
      this.tooltip = `${this.sourceAddr}@${this.version}`;
    }

    this.iconPath = this.getIcon(this.sourceType);
  }

  // iconPath = this.getIcon(this.sourceType);

  getIcon(type: string | undefined) {
    switch (type) {
      case 'tfregistry':
        return {
          light: this.terraformIcon,
          dark: this.terraformIcon,
        };
      case 'local':
        return new vscode.ThemeIcon('symbol-folder');
      case 'github':
        return new vscode.ThemeIcon('github');
      case 'git':
        return new vscode.ThemeIcon('git-branch');
      default:
        return new vscode.ThemeIcon('extensions-view-icon');
    }
  }
}

export class ModuleCallsDataProvider implements vscode.TreeDataProvider<ModuleCallItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<ModuleCallItem | undefined | null | void> = new vscode.EventEmitter<
    ModuleCallItem | undefined | null | void
  >();
  readonly onDidChangeTreeData: vscode.Event<ModuleCallItem | undefined | null | void> =
    this._onDidChangeTreeData.event;

  private svg = '';

  constructor(
    ctx: vscode.ExtensionContext,
    public client: LanguageClient,
  ) {
    this.svg = ctx.asAbsolutePath(path.join('assets', 'icons', 'opentofu.svg'));

    ctx.subscriptions.push(
      vscode.commands.registerCommand('opentofu.modules.refreshList', () => this.refresh()),
      vscode.commands.registerCommand('opentofu.modules.openDocumentation', (module: ModuleCallItem) => {
        if (module.docsLink) {
          vscode.env.openExternal(vscode.Uri.parse(module.docsLink));
        }
      }),
      vscode.window.onDidChangeActiveTextEditor(async () => {
        // most of the time this is called when the user switches tabs or closes the file
        // we already check for state inside the getModule function, so we can just call refresh here
        this.refresh();
      }),
    );
  }

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: ModuleCallItem): ModuleCallItem | Thenable<ModuleCallItem> {
    return element;
  }

  getChildren(element?: ModuleCallItem): vscode.ProviderResult<ModuleCallItem[]> {
    if (element) {
      return Promise.resolve(element.children);
    } else {
      const m = this.getModules();
      return Promise.resolve(m);
    }
  }

  async getModules(): Promise<ModuleCallItem[]> {
    const activeEditor = getActiveTextEditor();

    await vscode.commands.executeCommand('setContext', 'terraform.modules.documentOpened', true);
    await vscode.commands.executeCommand('setContext', 'terraform.modules.documentIsTerraform', true);
    await vscode.commands.executeCommand('setContext', 'terraform.modules.lspConnected', true);
    await vscode.commands.executeCommand('setContext', 'terraform.modules.noResponse', false);
    await vscode.commands.executeCommand('setContext', 'terraform.modules.noModules', false);

    if (activeEditor?.document === undefined) {
      // there is no open document
      await vscode.commands.executeCommand('setContext', 'terraform.modules.documentOpened', false);
      return [];
    }

    if (!isTerraformFile(activeEditor.document)) {
      // the open file is not a terraform file
      await vscode.commands.executeCommand('setContext', 'terraform.modules.documentIsTerraform', false);
      return [];
    }

    if (this.client === undefined) {
      // connection to terraform-ls failed
      await vscode.commands.executeCommand('setContext', 'terraform.modules.lspConnected', false);
      return [];
    }

    const editor = activeEditor.document.uri;
    const documentURI = Utils.dirname(editor);

    let response: terraform.ModuleCallsResponse;
    try {
      response = await terraform.moduleCalls(documentURI.toString(), this.client);
      if (response === null) {
        // no response from terraform-ls
        await vscode.commands.executeCommand('setContext', 'terraform.modules.noResponse', true);
        return [];
      }
    } catch {
      // error from terraform-ls
      await vscode.commands.executeCommand('setContext', 'terraform.modules.noResponse', true);
      return [];
    }

    try {
      const list = response.module_calls.map((m) => {
        return this.toModuleCall(
          m.name,
          m.source_addr,
          m.version,
          m.source_type,
          m.docs_link,
          this.svg,
          m.dependent_modules,
        );
      });

      if (list.length === 0) {
        await vscode.commands.executeCommand('setContext', 'terraform.modules.noModules', true);
      }

      return list;
    } catch {
      // error mapping response
      await vscode.commands.executeCommand('setContext', 'terraform.modules.noResponse', true);
      return [];
    }
  }

  toModuleCall(
    name: string,
    sourceAddr: string,
    version: string | undefined,
    sourceType: string | undefined,
    docsLink: string | undefined,
    terraformIcon: string,
    dependents: terraform.ModuleCall[],
  ): ModuleCallItem {
    let deps: ModuleCallItem[] = [];
    if (dependents.length !== 0) {
      deps = dependents.map((dp) =>
        this.toModuleCall(
          dp.name,
          dp.source_addr,
          dp.version,
          dp.source_type,
          dp.docs_link,
          terraformIcon,
          dp.dependent_modules,
        ),
      );
    }

    return new ModuleCallItem(name, sourceAddr, version, sourceType, docsLink, terraformIcon, deps);
  }
}
