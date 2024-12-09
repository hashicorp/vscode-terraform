/**
 * Copyright (c) HashiCorp, Inc.
 * SPDX-License-Identifier: MPL-2.0
 */

import * as vscode from 'vscode';
import TelemetryReporter from '@vscode/extension-telemetry';

import { RunTreeDataProvider } from './runProvider';
import { apiClient, TerraformCloudUrl, TerraformCloudWebUrl } from '../../api/terraformCloud';
import { TerraformCloudAuthenticationProvider } from './authenticationProvider';
import { ProjectsAPIResource, ResetProjectItem } from './workspaceFilters';
import { GetRunStatusIcon, GetRunStatusMessage, RelativeTimeFormat } from './helpers';
import { WorkspaceAttributes } from '../../api/terraformCloud/workspace';
import { RunAttributes } from '../../api/terraformCloud/run';
import { APIQuickPick, handleAuthError, handleZodiosError } from './uiHelpers';
import { isErrorFromAlias, ZodiosError } from '@zodios/core';
import axios from 'axios';
import { apiErrorsToString } from '../../api/terraformCloud/errors';

export class WorkspaceTreeDataProvider implements vscode.TreeDataProvider<vscode.TreeItem>, vscode.Disposable {
  private readonly didChangeTreeData = new vscode.EventEmitter<undefined | vscode.TreeItem>();
  public readonly onDidChangeTreeData = this.didChangeTreeData.event;
  private projectFilter: string | undefined;
  private pageSize = 50;
  private cache: vscode.TreeItem[] = [];
  private nextPage: number | null = null;

  constructor(
    private ctx: vscode.ExtensionContext,
    private runDataProvider: RunTreeDataProvider,
    private reporter: TelemetryReporter,
    private outputChannel: vscode.OutputChannel,
  ) {
    this.ctx.subscriptions.push(
      vscode.commands.registerCommand('terraform.cloud.workspaces.refresh', (workspaceItem: WorkspaceTreeItem) => {
        this.reporter.sendTelemetryEvent('tfc-workspaces-refresh');
        this.reset();
        this.refresh();
        this.runDataProvider.refresh(workspaceItem);
      }),
      vscode.commands.registerCommand('terraform.cloud.workspaces.resetProjectFilter', () => {
        this.reporter.sendTelemetryEvent('tfc-workspaces-filter-reset');
        this.projectFilter = undefined;
        this.reset();
        this.refresh();
        this.runDataProvider.refresh();
      }),
      vscode.commands.registerCommand(
        'terraform.cloud.workspaces.viewInBrowser',
        (workspaceItem: WorkspaceTreeItem) => {
          this.reporter.sendTelemetryEvent('tfc-workspaces-viewInBrowser');
          const workspaceURL = `${TerraformCloudWebUrl}/${workspaceItem.organization}/workspaces/${workspaceItem.attributes.name}`;
          vscode.env.openExternal(vscode.Uri.parse(workspaceURL));
        },
      ),
      vscode.commands.registerCommand('terraform.cloud.organization.viewInBrowser', () => {
        this.reporter.sendTelemetryEvent('tfc-organization-viewInBrowser');
        const organization = this.ctx.workspaceState.get('terraform.cloud.organization', '');
        const orgURL = `${TerraformCloudWebUrl}/${organization}`;
        vscode.env.openExternal(vscode.Uri.parse(orgURL));
      }),
      vscode.commands.registerCommand('terraform.cloud.workspaces.filterByProject', async () => {
        this.reporter.sendTelemetryEvent('tfc-workspaces-filter');
        await this.filterByProject();
      }),
      vscode.commands.registerCommand('terraform.cloud.workspaces.loadMore', () => {
        this.reporter.sendTelemetryEvent('tfc-workspaces-loadMore');
        this.refresh();
        this.runDataProvider.refresh();
      }),
    );
  }

  refresh(): void {
    this.didChangeTreeData.fire(undefined);
  }

  // This resets the internal cache, e.g. after logout
  reset(): void {
    this.nextPage = null;
    this.cache = [];
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
    this.reset();
    this.refresh();
    this.runDataProvider.refresh();
  }

  getTreeItem(element: vscode.TreeItem): vscode.TreeItem | Thenable<vscode.TreeItem> {
    return element;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getChildren(element?: any): vscode.ProviderResult<vscode.TreeItem[]> {
    if (element) {
      return [element as vscode.TreeItem];
    }

    return this.buildChildren();
  }

  private async buildChildren() {
    try {
      this.cache = [...this.cache, ...(await this.getWorkspaces())];
    } catch {
      return [];
    }

    const items = this.cache.slice(0);
    if (this.nextPage !== null) {
      items.push(new LoadMoreTreeItem());
    }

    return items;
  }

  private async getWorkspaces(): Promise<vscode.TreeItem[]> {
    const organization: string = this.ctx.workspaceState.get('terraform.cloud.organization', '');
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
          'page[size]': this.pageSize,
          'page[number]': this.nextPage ?? 1,
          sort: '-current-run.created-at',
        },
      });
      this.nextPage = workspaceResponse.meta.pagination['next-page'];

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

      // We can imply organization existence based on 200 OK (i.e. not 404) here
      vscode.commands.executeCommand('setContext', 'terraform.cloud.organizationsExist', true);

      const workspaces = workspaceResponse.data;
      if (workspaces.length <= 0) {
        await vscode.commands.executeCommand('setContext', 'terraform.cloud.workspacesExist', false);

        // check if the user has pending invitation to the org
        // as that may be a reason for zero workspaces
        const memberships = await apiClient.listOrganizationMemberships({});
        const pendingMembership = memberships.data.filter(
          (membership) =>
            membership.relationships.organization.data.id === organization &&
            membership.attributes.status === 'invited',
        );
        if (pendingMembership.length > 0) {
          await vscode.commands.executeCommand('setContext', 'terraform.cloud.pendingOrgMembership', true);
        } else {
          await vscode.commands.executeCommand('setContext', 'terraform.cloud.pendingOrgMembership', false);
        }

        return [];
      } else {
        await vscode.commands.executeCommand('setContext', 'terraform.cloud.workspacesExist', true);
        await vscode.commands.executeCommand('setContext', 'terraform.cloud.pendingOrgMembership', false);
      }
      const projects = projectResponse.data;

      const items: WorkspaceTreeItem[] = [];
      for (const workspace of workspaces) {
        const project = projects.find((p) => p.id === workspace.relationships.project?.data?.id);
        const projectName = project ? project.attributes.name : '';

        const lastRunId = workspace.relationships['latest-run']?.data?.id;
        const lastestRun = workspaceResponse.included
          ? workspaceResponse.included.find((run) => run.id === lastRunId)
          : undefined;
        const link = vscode.Uri.joinPath(vscode.Uri.parse(TerraformCloudUrl), workspace.links['self-html']);

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
        await handleZodiosError(error, message, this.outputChannel, this.reporter);
        return [];
      }

      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          await handleAuthError();
          return [];
        }

        if (error.response?.status === 404) {
          vscode.commands.executeCommand('setContext', 'terraform.cloud.organizationsExist', false);
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
          this.reporter.sendTelemetryErrorEvent('workspaceProviderError', {
            message: message,
            stack: error.stack,
          });
          return [];
        }
      }

      if (error instanceof Error) {
        message += error.message;
        vscode.window.showErrorMessage(message);
        this.reporter.sendTelemetryErrorEvent('workspaceProviderError', {
          message: message,
          stack: error.stack,
        });
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

export class LoadMoreTreeItem extends vscode.TreeItem {
  constructor() {
    super('Load more...', vscode.TreeItemCollapsibleState.None);

    this.iconPath = new vscode.ThemeIcon('ellipsis', new vscode.ThemeColor('charts.gray'));
    this.command = {
      command: 'terraform.cloud.workspaces.loadMore',
      title: 'Load more',
    };
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
    this.contextValue = 'hasLink';

    const lockedTxt = this.attributes.locked ? '$(lock) Locked' : '$(unlock) Unlocked';
    const vscText =
      this.attributes['vcs-repo-identifier'] && this.attributes['vcs-repo']
        ? `$(source-control) [${this.attributes['vcs-repo-identifier']}](${this.attributes['vcs-repo']['repository-http-url']})`
        : '';

    const statusMsg = GetRunStatusMessage(this.lastRun?.status);
    const updatedAt = RelativeTimeFormat(this.attributes['updated-at']);
    const text = `
## $(${this.iconPath.id}) [${this.attributes.name}](${this.weblink.toString()})

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
