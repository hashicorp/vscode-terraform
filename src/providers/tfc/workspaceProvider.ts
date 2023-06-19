/**
 * Copyright (c) HashiCorp, Inc.
 * SPDX-License-Identifier: MPL-2.0
 */

import * as vscode from 'vscode';
import TelemetryReporter from '@vscode/extension-telemetry';

import { RunTreeDataProvider } from './runProvider';
import { apiClient, TerraformCloudWebUrl } from '../../terraformCloud';
import { TerraformCloudAuthenticationProvider } from '../authenticationProvider';
import { ProjectsAPIResource, ResetProjectItem } from './workspaceFilters';
import { GetRunStatusIcon, GetRunStatusMessage, RelativeTimeFormat } from './helpers';
import { WorkspaceAttributes } from '../../terraformCloud/workspace';
import { RunAttributes } from '../../terraformCloud/run';
import { APIQuickPick, handleAuthError, handleZodiosError } from './uiHelpers';
import { isErrorFromAlias, ZodiosError } from '@zodios/core';
import axios from 'axios';
import { apiErrorsToString } from '../../terraformCloud/errors';

export class WorkspaceTreeDataProvider implements vscode.TreeDataProvider<WorkspaceTreeItem>, vscode.Disposable {
  private readonly didChangeTreeData = new vscode.EventEmitter<void | WorkspaceTreeItem>();
  public readonly onDidChangeTreeData = this.didChangeTreeData.event;
  private projectFilter: string | undefined;

  constructor(
    private ctx: vscode.ExtensionContext,
    private runDataProvider: RunTreeDataProvider,
    private reporter: TelemetryReporter,
    private outputChannel: vscode.OutputChannel,
  ) {
    this.ctx.subscriptions.push(
      vscode.commands.registerCommand('terraform.cloud.workspaces.refresh', (workspaceItem: WorkspaceTreeItem) => {
        this.reporter.sendTelemetryEvent('tfc-workspaces-refresh');
        this.refresh();
        this.runDataProvider.refresh(workspaceItem);
      }),
      vscode.commands.registerCommand('terraform.cloud.workspaces.resetProjectFilter', () => {
        this.reporter.sendTelemetryEvent('tfc-workspaces-filter-reset');
        this.projectFilter = undefined;
        this.refresh();
      }),
      vscode.commands.registerCommand(
        'terraform.cloud.workspaces.viewInBrowser',
        (workspaceItem: WorkspaceTreeItem) => {
          this.reporter.sendTelemetryEvent('tfc-workspaces-viewInBrowser');
          const runURL = `${TerraformCloudWebUrl}/${workspaceItem.organization}/workspaces/${workspaceItem.attributes.name}`;
          vscode.env.openExternal(vscode.Uri.parse(runURL));
        },
      ),
      vscode.commands.registerCommand('terraform.cloud.workspaces.filterByProject', () => {
        this.reporter.sendTelemetryEvent('tfc-workspaces-filter');
        this.filterByProject();
      }),
    );
  }

  refresh(): void {
    this.didChangeTreeData.fire();
  }

  async filterByProject(): Promise<void> {
    const session = await vscode.authentication.getSession(TerraformCloudAuthenticationProvider.providerID, [], {
      createIfNone: false,
    });

    if (session === undefined) {
      return;
    }

    const organization = this.ctx.workspaceState.get('terraform.cloud.organization', '');
    const projectAPIResource = new ProjectsAPIResource(organization, this.outputChannel, this.reporter);
    const projectQuickPick = new APIQuickPick(projectAPIResource);
    const project = await projectQuickPick.pick();

    if (project === undefined || project instanceof ResetProjectItem) {
      this.projectFilter = undefined;
      await vscode.commands.executeCommand('setContext', 'terraform.cloud.projectFilterUsed', false);
    } else {
      this.projectFilter = project.description;
      await vscode.commands.executeCommand('setContext', 'terraform.cloud.projectFilterUsed', true);
    }
    this.refresh();
    this.runDataProvider.refresh();
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
          'page[size]': 50,
          sort: '-current-run.created-at',
        },
      });

      this.reporter.sendTelemetryEvent('tfc-fetch-workspaces', undefined, {
        totalCount: workspaceResponse.meta.pagination['total-count'],
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
      if (workspaces.length <= 0) {
        await vscode.commands.executeCommand('setContext', 'terraform.cloud.workspacesExist', false);
        return [];
      } else {
        await vscode.commands.executeCommand('setContext', 'terraform.cloud.workspacesExist', true);
      }
      const projects = projectResponse.data;

      const items: WorkspaceTreeItem[] = [];
      for (let index = 0; index < workspaces.length; index++) {
        const workspace = workspaces[index];

        const project = projects.find((p) => p.id === workspace.relationships['project']?.data?.id);
        const projectName = project ? project.attributes.name : '';

        const lastRunId = workspace.relationships['latest-run']?.data?.id;
        const lastestRun = workspaceResponse.included
          ? workspaceResponse.included.find((run) => run.id === lastRunId)
          : undefined;
        const link = vscode.Uri.joinPath(vscode.Uri.parse(TerraformCloudWebUrl), workspace.links['self-html']);

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
      let message = `Failed to list workspaces in ${organization}: `;

      if (error instanceof ZodiosError) {
        handleZodiosError(error, message, this.outputChannel, this.reporter);
        return [];
      }

      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          handleAuthError();
          return [];
        }

        if (error.response?.status === 404) {
          vscode.window.showWarningMessage(`Organization '${organization}' not found, please pick another one`);
          vscode.commands.executeCommand('terraform.cloud.organization.picker');
          return [];
        }

        if (
          isErrorFromAlias(apiClient.api, 'listWorkspaces', error) ||
          isErrorFromAlias(apiClient.api, 'listProjects', error)
        ) {
          message += apiErrorsToString(error.response.data.errors);
          vscode.window.showErrorMessage(message);
          this.reporter.sendTelemetryException(error);
          return [];
        }
      }

      if (error instanceof Error) {
        message += error.message;
        vscode.window.showErrorMessage(message);
        this.reporter.sendTelemetryException(error);
        return [];
      }

      if (typeof error === 'string') {
        message += error;
      }
      vscode.window.showErrorMessage(message);
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

    this.description = `[${this.projectName}]`;
    this.iconPath = GetRunStatusIcon(this.lastRun?.status);

    const lockedTxt = this.attributes.locked ? '$(lock) Locked' : '$(unlock) Unlocked';
    const vscText =
      this.attributes['vcs-repo-identifier'] && this.attributes['vcs-repo']
        ? `$(source-control) [${this.attributes['vcs-repo-identifier']}](${this.attributes['vcs-repo']['repository-http-url']})`
        : '';

    const statusMsg = GetRunStatusMessage(this.lastRun?.status);
    const updatedAt = RelativeTimeFormat(this.attributes['updated-at']);
    const text = `
## $(${this.iconPath.id}) [${this.attributes.name}](${this.weblink})

#### ID: *${this.id}*

Run Status: $(${this.iconPath.id}) ${statusMsg}

${lockedTxt}
___
| | |
--|--
| **Resources**         | ${this.attributes['resource-count']}|
| **Terraform Version** | ${this.attributes['terraform-version']}|
| **Updated**           | ${updatedAt}|

___
| | |
--|--
| ${vscText} | |
| **$(zap) Execution Mode** | ${this.attributes['execution-mode']}|
| **$(gear) Auto Apply**    | ${updatedAt}|
`;

    this.tooltip = new vscode.MarkdownString(text, true);
  }
}
