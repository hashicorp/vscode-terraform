/**
 * Copyright (c) HashiCorp, Inc.
 * SPDX-License-Identifier: MPL-2.0
 */

import * as vscode from 'vscode';
import { apiClient } from '../../terraformCloud';
import { TerraformCloudAuthenticationProvider } from '../authenticationProvider';
import axios from 'axios';
import { RunAttributes } from '../../terraformCloud/run';
import { WorkspaceTreeItem } from './workspaceProvider';
import { GetRunStatusIcon } from './helpers';

export class RunTreeDataProvider implements vscode.TreeDataProvider<vscode.TreeItem>, vscode.Disposable {
  private readonly didChangeTreeData = new vscode.EventEmitter<void | vscode.TreeItem>();
  public readonly onDidChangeTreeData = this.didChangeTreeData.event;
  private activeWorkspace: WorkspaceTreeItem | undefined;

  constructor(private ctx: vscode.ExtensionContext) {
    this.ctx.subscriptions.push(
      vscode.commands.registerCommand('terraform.cloud.runs.refresh', () => {
        this.refresh(this.activeWorkspace);
      }),
    );

    // TODO: get from settings or somewhere global
    const baseUrl = 'https://app.staging.terraform.io/app';

    this.ctx.subscriptions.push(
      vscode.commands.registerCommand('terraform.cloud.run.viewInBrowser', (run: RunTreeItem) => {
        const orgName = this.ctx.workspaceState.get('terraform.cloud.organization', '');
        if (orgName === '') {
          return;
        }

        const runURL = `${baseUrl}/${orgName}/workspaces/${run.workspaceName}/runs/${run.id}`;

        vscode.env.openExternal(vscode.Uri.parse(runURL));
      }),
    );
  }

  refresh(workspaceItem?: WorkspaceTreeItem): void {
    this.activeWorkspace = workspaceItem;
    this.didChangeTreeData.fire();
  }

  getTreeItem(element: vscode.TreeItem): vscode.TreeItem | Thenable<vscode.TreeItem> {
    return element;
  }

  getChildren(element?: vscode.TreeItem | undefined): vscode.ProviderResult<vscode.TreeItem[]> {
    if (element) {
      return [element];
    }
    if (!this.activeWorkspace) {
      return [];
    }

    try {
      return this.getRuns(this.activeWorkspace.id, this.activeWorkspace.attributes.name);
    } catch (error) {
      return [];
    }
  }

  // TODO: Implement resolveTreeItem() to pull and display ingress attributes on hover (branch, SHA, author)

  private async getRuns(workspaceId: string, workspaceName: string): Promise<vscode.TreeItem[]> {
    const organization = this.ctx.workspaceState.get('terraform.cloud.organization', '');
    if (organization === '') {
      return [];
    }

    const session = await vscode.authentication.getSession(TerraformCloudAuthenticationProvider.providerID, [], {
      createIfNone: false,
    });

    if (session === undefined) {
      return [];
    }

    try {
      const runs = await apiClient.listRuns({
        params: { workspace_id: workspaceId },
      });

      if (runs.data.length === 0) {
        return [{ label: `No runs found for ${workspaceName}` }];
      }

      const items: RunTreeItem[] = [];
      for (let index = 0; index < runs.data.length; index++) {
        const run = runs.data[index];
        items.push(new RunTreeItem(run.id, workspaceName, run.attributes));
      }

      // TODO: pagination

      return items;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        vscode.window.showErrorMessage(`Runs not accessible for workspace ${workspaceId}: ${error}`);
      } else if (error instanceof Error) {
        vscode.window.showErrorMessage(error.message);
      } else if (typeof error === 'string') {
        vscode.window.showErrorMessage(error);
      }
      return [];
    }
  }

  dispose() {
    //
  }
}

export class RunTreeItem extends vscode.TreeItem {
  constructor(public id: string, public workspaceName: string, public attributes: RunAttributes) {
    super(attributes.message, vscode.TreeItemCollapsibleState.None);
    this.id = id;

    this.workspaceName = workspaceName;
    this.iconPath = GetRunStatusIcon(attributes.status);
    this.description = `${attributes['trigger-reason']} ${attributes['created-at']}`;
    this.tooltip = new vscode.MarkdownString(`
### \`${workspaceName}\`
#### ID: \`${id}\`
___
${attributes.message}
___
| | |
--|--
| **Status**               | ${attributes.status}|
| **Trigger reason** | ${attributes['trigger-reason']}|
| **Created at**        | ${attributes['created-at']}|
| **Source**              | ${attributes.source}|
| **Terraform**         | ${attributes['terraform-version']}|
`);
  }
}
