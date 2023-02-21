/**
 * Copyright (c) HashiCorp, Inc.
 * SPDX-License-Identifier: MPL-2.0
 */

import TelemetryReporter from '@vscode/extension-telemetry';
import * as path from 'path';
import * as terraform from '../terraform';
import * as vscode from 'vscode';
import { LanguageClient } from 'vscode-languageclient/node';
import { Utils } from 'vscode-uri';
import { getActiveTextEditor, isTerraformFile } from '../utils/vscode';

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
  }

  iconPath = this.getIcon(this.sourceType);

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

  constructor(ctx: vscode.ExtensionContext, public client: LanguageClient, private reporter: TelemetryReporter) {
    this.svg = ctx.asAbsolutePath(path.join('assets', 'icons', 'terraform.svg'));

    ctx.subscriptions.push(
      vscode.commands.registerCommand('terraform.modules.refreshList', () => this.refresh()),
      vscode.commands.registerCommand('terraform.modules.openDocumentation', (module: ModuleCallItem) => {
        if (module.docsLink) {
          vscode.env.openExternal(vscode.Uri.parse(module.docsLink));
        }
      }),
      vscode.window.onDidChangeActiveTextEditor(async (event: vscode.TextEditor | undefined) => {
        const activeEditor = getActiveTextEditor();

        if (!isTerraformFile(activeEditor?.document)) {
          return;
        }

        if (event && activeEditor) {
          this.refresh();
        }
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

    if (activeEditor?.document === undefined) {
      return [];
    }

    if (!isTerraformFile(activeEditor.document)) {
      return [];
    }

    const editor = activeEditor.document.uri;
    const documentURI = Utils.dirname(editor);
    if (this.client === undefined) {
      return [];
    }

    try {
      const response = await terraform.moduleCalls(documentURI.toString(), this.client, this.reporter);
      if (response === null) {
        return [];
      }

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

      return list;
    } catch {
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
