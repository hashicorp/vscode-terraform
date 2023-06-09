/**
 * Copyright (c) HashiCorp, Inc.
 * SPDX-License-Identifier: MPL-2.0
 */

import * as vscode from 'vscode';
import axios from 'axios';

import { RunTreeDataProvider } from './runProvider';
import { apiClient } from '../../terraformCloud';
import { TerraformCloudAuthenticationProvider } from '../authenticationProvider';
import { ProjectQuickPick, ResetProjectItem } from './workspaceFilters';
import { GetRunStatusIcon } from './helpers';
import { WorkspaceAttributes } from '../../terraformCloud/workspace';
import { RunAttributes } from '../../terraformCloud/run';

export class WorkspaceTreeDataProvider implements vscode.TreeDataProvider<WorkspaceTreeItem>, vscode.Disposable {
  private readonly didChangeTreeData = new vscode.EventEmitter<void | WorkspaceTreeItem>();
  public readonly onDidChangeTreeData = this.didChangeTreeData.event;
  private projectFilter: string | undefined;

  // TODO: get from settings or somewhere global
  private baseUrl = 'https://app.staging.terraform.io/app';

  constructor(private ctx: vscode.ExtensionContext, private runDataProvider: RunTreeDataProvider) {
    this.ctx.subscriptions.push(
      vscode.commands.registerCommand('terraform.cloud.workspaces.refresh', (workspaceItem: WorkspaceTreeItem) => {
        this.refresh();
        this.runDataProvider.refresh(workspaceItem);
      }),
      vscode.commands.registerCommand(
        'terraform.cloud.workspaces.viewInBrowser',
        (workspaceItem: WorkspaceTreeItem) => {
          const runURL = `${this.baseUrl}/${workspaceItem.organization}/workspaces/${workspaceItem.attributes.name}`;
          vscode.env.openExternal(vscode.Uri.parse(runURL));
        },
      ),
      vscode.commands.registerCommand('terraform.cloud.workspaces.filterByProject', () => this.filterByProject()),
    );
  }

  refresh(): void {
    this.didChangeTreeData.fire();
  }

  async filterByProject(): Promise<void> {
    // TODO! only run this if user is logged in
    const organization = this.ctx.workspaceState.get('terraform.cloud.organization', '');
    const projectQuickPick = new ProjectQuickPick(organization);
    const project = await projectQuickPick.pick();

    if (project === undefined || project instanceof ResetProjectItem) {
      this.projectFilter = undefined;
    } else {
      this.projectFilter = project.description;
    }
    this.refresh();
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
        queries: {
          include: ['current_run'],
          // Include query parameter only if project filter is set
          ...(this.projectFilter && { 'filter[project][id]': this.projectFilter }),
        },
      });

      // TODO? we could skip this request if a project filter is set,
      // but with the addition of more filters, we could still get
      // projects from different workspaces
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

        const lastRunId = workspace.relationships['latest-run']?.data?.id;
        const lastestRun = workspaceResponse.included
          ? workspaceResponse.included.find((run) => run.id === lastRunId)
          : undefined;
        const link = vscode.Uri.joinPath(vscode.Uri.parse(this.baseUrl), workspace.links['self-html']);

        items.push(
          new WorkspaceTreeItem(
            workspace.attributes,
            workspace.id,
            projectName,
            organization,
            link,
            lastestRun?.attributes,
          ),
        );
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
  constructor(
    public attributes: WorkspaceAttributes,
    public id: string,
    public projectName: string,
    public organization: string,
    public weblink: vscode.Uri,
    public lastRun?: RunAttributes,
  ) {
    super(attributes.name, vscode.TreeItemCollapsibleState.None);

    this.description = this.projectName;

    if (this.lastRun) {
      this.iconPath = GetRunStatusIcon(this.lastRun.status);
    }

    const lockedTxt = this.attributes.locked ? '$(lock) Locked' : '$(unlock) Unlocked';
    const vscText = this.attributes['vcs-repo-identifier']
      ? `$(source-control) [${this.attributes['vcs-repo-identifier']}](${this.attributes['vcs-repo']['repository-http-url']})`
      : '';
    const text = `
## [${this.attributes.name}](${this.weblink})

#### ID: *${this.id}*

${lockedTxt}
___
| | |
--|--
| **Resources**         | ${this.attributes['resource-count']}|
| **Terraform Version** | ${this.attributes['terraform-version']}|
| **Updated at**        | ${this.attributes['updated-at']}|

___
| | |
--|--
| ${vscText} | |
| **$(zap) Execution Mode** | ${this.attributes['terraform-version']}|
| **$(gear) Auto Apply**    | ${this.attributes['updated-at']}|
`;

    this.tooltip = new vscode.MarkdownString(text, true);
  }
}
