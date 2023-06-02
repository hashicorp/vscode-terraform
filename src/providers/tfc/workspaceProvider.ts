/**
 * Copyright (c) HashiCorp, Inc.
 * SPDX-License-Identifier: MPL-2.0
 */

import * as vscode from 'vscode';
import { RunTreeDataProvider } from './runProvider';
import { apiClient } from '../../terraformCloud';
import { TerraformCloudAuthenticationProvider } from '../authenticationProvider';
import axios from 'axios';

export class WorkspaceTreeDataProvider implements vscode.TreeDataProvider<WorkspaceTreeItem>, vscode.Disposable {
  private readonly didChangeTreeData = new vscode.EventEmitter<void | WorkspaceTreeItem>();
  public readonly onDidChangeTreeData = this.didChangeTreeData.event;

  constructor(private ctx: vscode.ExtensionContext, private runDataProvider: RunTreeDataProvider) {
    this.ctx.subscriptions.push(
      vscode.commands.registerCommand('terraform.cloud.workspaces.refresh', (workspaceItem: WorkspaceTreeItem) => {
        this.refresh();
        this.runDataProvider.refresh(workspaceItem);
      }),
    );
  }

  refresh(): void {
    this.didChangeTreeData.fire();
  }

  getTreeItem(element: WorkspaceTreeItem): vscode.TreeItem | Thenable<vscode.TreeItem> {
    return element;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getChildren(element?: any): vscode.ProviderResult<WorkspaceTreeItem[]> {
    if (element) {
      return [element];
    }

    try {
      return this.getWorkspaces();
    } catch (error) {
      return [];
    }
  }

  private async getWorkspaces() {
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
      const workspaceResponse = await apiClient.listWorkspaces({
        params: {
          organization_name: organization,
        },
      });

      const projectResponse = await apiClient.listProjects({
        params: {
          organization_name: organization,
        },
      });

      const workspaces = workspaceResponse.data;
      const projects = projectResponse.data;

      const items: WorkspaceTreeItem[] = [];
      for (let index = 0; index < workspaces.length; index++) {
        const workspace = workspaces[index];

        const project = projects.find((p) => p.id === workspace.relationships.project.data.id);

        const projectName = project ? project.attributes.name : '';
        items.push(new WorkspaceTreeItem(workspace.attributes.name, workspace.id, projectName));
      }

      return items;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        vscode.window.showErrorMessage('Invalid token supplied, please try again');
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

export class WorkspaceTreeItem extends vscode.TreeItem {
  /**
   * @param name The Workspace Name
   * @param id This is the workspaceID as well as the unique ID for the treeitem
   * @param projectName The name of the project this workspace is in
   */
  constructor(public name: string, public id: string, public projectName: string) {
    super(name, vscode.TreeItemCollapsibleState.None);
    this.description = this.projectName;
    this.tooltip = new vscode.MarkdownString(`
### ${this.name}
ID: ${this.id}
`);
  }
}
