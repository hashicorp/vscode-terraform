/**
 * Copyright (c) HashiCorp, Inc.
 * SPDX-License-Identifier: MPL-2.0
 */

import * as vscode from 'vscode';
import * as semver from 'semver';
import axios from 'axios';
import TelemetryReporter from '@vscode/extension-telemetry';
import { apiClient, TerraformCloudWebUrl } from '../../../api/terraformCloud';
import { TerraformCloudAuthenticationProvider } from '../auth/authenticationProvider';
import { ProjectsAPIResource } from '../project/projectPicker';
import { ResetProjectItem } from '../project/resetProjectItem';
import { GetRunStatusIcon, GetRunStatusMessage, RelativeTimeFormat } from '../helpers';
import { RUN_SOURCE, TRIGGER_REASON } from '../../../api/terraformCloud/run';
import { APIQuickPick } from '../apiPicker';
import { handleAuthError } from '../helpers';
import { handleZodiosError } from '../helpers';
import { isErrorFromAlias, ZodiosError } from '@zodios/core';
import { apiErrorsToString } from '../../../api/terraformCloud/errors';
import { OrganizationAPIResource } from '../organization/organizationPicker';
import { CreateOrganizationItem } from '../organization/createOrganizationItem';
import { RefreshOrganizationItem } from '../organization/refreshOrganizationItem';
import { ApplyAttributes } from '../../../api/terraformCloud/apply';
import { PlanAttributes } from '../../../api/terraformCloud/plan';
import { CONFIGURATION_SOURCE } from '../../../api/terraformCloud/configurationVersion';
import { RunTreeItem } from './runTreeItem';
import { PlanTreeItem } from '../plan/planTreeItem';
import { ApplyTreeItem } from './applyTreeItem';
import { WorkspaceTreeItem } from './workspaceTreeItem';
import { LoadMoreTreeItem } from './loadMoreTreeItem';

export type TFCRunTreeItem = RunTreeItem | PlanTreeItem | ApplyTreeItem | vscode.TreeItem;

export class WorkspaceTreeDataProvider implements vscode.TreeDataProvider<vscode.TreeItem>, vscode.Disposable {
  private readonly didChangeTreeData = new vscode.EventEmitter<void | vscode.TreeItem>();
  public readonly onDidChangeTreeData = this.didChangeTreeData.event;

  private readonly didChangeSelection = new vscode.EventEmitter<void | vscode.TreeItem>();
  public readonly onDidChangeSelection = this.didChangeSelection.event;

  private readonly didChangeVisibility = new vscode.EventEmitter<boolean>();
  public readonly onDidChangeVisibility = this.didChangeVisibility.event;

  private readonly didChangeTitle = new vscode.EventEmitter<string>();
  public readonly onDidChangeTitle = this.didChangeTitle.event;

  private readonly planSelected = new vscode.EventEmitter<PlanTreeItem>();
  public readonly onDidplanSelected = this.planSelected.event;

  private readonly applySelected = new vscode.EventEmitter<ApplyTreeItem>();
  public readonly onDidApplySelected = this.applySelected.event;

  private projectFilter: string | undefined;
  private pageSize = 50;
  private cache: vscode.TreeItem[] = [];
  private nextPage: number | null = null;

  constructor(
    private ctx: vscode.ExtensionContext,
    private reporter: TelemetryReporter,
    private outputChannel: vscode.OutputChannel,
  ) {
    const workspaceView = vscode.window.createTreeView('terraform.cloud.workspaces', {
      canSelectMany: false,
      showCollapseAll: true,
      treeDataProvider: this,
    });
    const organization = this.ctx.workspaceState.get('terraform.cloud.organization', '');
    workspaceView.title = organization !== '' ? `Workspaces - (${organization})` : 'Workspaces';
    workspaceView.onDidChangeSelection((event) => {
      if (event.selection.length <= 0) {
        return;
      }

      // we don't allow multi-select yet so this will always be one
      const item = event.selection[0];
      if (item instanceof WorkspaceTreeItem) {
        this.didChangeSelection.fire(item);
      }
    });
    workspaceView.onDidChangeVisibility(async (event) => {
      if (event.visible) {
        this.didChangeVisibility.fire(true);
      } else {
        this.didChangeVisibility.fire(false);
      }
    });

    vscode.authentication.onDidChangeSessions((e) => {
      // Refresh the workspace list if the user changes session
      if (e.provider.id === TerraformCloudAuthenticationProvider.providerID) {
        this.reset();
        this.refresh();
      }
    });

    this.ctx.subscriptions.push(
      vscode.commands.registerCommand('terraform.cloud.workspaces.refresh', () => {
        this.reporter.sendTelemetryEvent('tfc-workspaces-refresh');
        this.reset();
        this.refresh();
      }),
      vscode.commands.registerCommand('terraform.cloud.workspaces.resetProjectFilter', () => {
        this.reporter.sendTelemetryEvent('tfc-workspaces-filter-reset');
        this.projectFilter = undefined;
        this.reset();
        this.refresh();
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
      vscode.commands.registerCommand('terraform.cloud.workspaces.filterByProject', () => {
        this.reporter.sendTelemetryEvent('tfc-workspaces-filter');
        this.filterByProject();
      }),
      vscode.commands.registerCommand('terraform.cloud.workspaces.loadMore', async () => {
        this.reporter.sendTelemetryEvent('tfc-workspaces-loadMore');
        this.refresh();
      }),
      vscode.commands.registerCommand('terraform.cloud.workspaces.picker', async () => {
        this.reporter.sendTelemetryEvent('tfc-new-workspace');
        const organization = this.ctx.workspaceState.get('terraform.cloud.organization', '');
        if (organization === '') {
          return [];
        }
        const terraformCloudURL = `${TerraformCloudWebUrl}/${organization}/workspaces/new`;
        await vscode.env.openExternal(vscode.Uri.parse(terraformCloudURL));
      }),
      vscode.commands.registerCommand('terraform.cloud.organization.picker', async () => {
        this.reporter.sendTelemetryEvent('tfc-pick-organization');

        const organizationAPIResource = new OrganizationAPIResource(outputChannel, reporter);
        const organizationQuickPick = new APIQuickPick(organizationAPIResource);
        let choice: vscode.QuickPickItem | undefined;

        // eslint-disable-next-line no-constant-condition
        while (true) {
          choice = await organizationQuickPick.pick(false);

          if (choice === undefined) {
            // user exited without answering, so don't do anything
            return;
          } else if (choice instanceof CreateOrganizationItem) {
            this.reporter.sendTelemetryEvent('tfc-pick-organization-create');

            // open the browser an re-run the loop
            choice.open();
            continue;
          } else if (choice instanceof RefreshOrganizationItem) {
            this.reporter.sendTelemetryEvent('tfc-pick-organization-refresh');
            // re-run the loop
            continue;
          }

          break;
        }

        // user chose an organization so update the statusbar and make sure its visible
        organizationQuickPick.hide();
        this.didChangeTitle.fire(choice.label);
        workspaceView.title = `Workspace - (${choice.label})`;

        // project filter should be cleared on org change
        await vscode.commands.executeCommand('terraform.cloud.workspaces.resetProjectFilter');
        // filter reset will refresh workspaces
      }),
      vscode.commands.registerCommand('terraform.cloud.run.plan.downloadLog', async (run: PlanTreeItem) => {
        this.downloadPlanLog(run);
      }),
      vscode.commands.registerCommand('terraform.cloud.run.apply.downloadLog', async (run: ApplyTreeItem) =>
        this.downloadApplyLog(run),
      ),
      vscode.commands.registerCommand('terraform.cloud.run.viewInBrowser', (run: RunTreeItem) => {
        this.reporter.sendTelemetryEvent('tfc-runs-viewInBrowser');
        vscode.env.openExternal(run.websiteUri);
      }),
      vscode.commands.registerCommand('terraform.cloud.run.viewPlan', async (plan: PlanTreeItem) => {
        if (!plan.logReadUrl) {
          await vscode.window.showErrorMessage(`No plan found for ${plan.id}`);
          return;
        }
        await vscode.commands.executeCommand('setContext', 'terraform.cloud.run.viewingPlan', true);
        await vscode.commands.executeCommand('terraform.cloud.run.plan.focus');
        this.planSelected.fire(plan);
      }),
      vscode.commands.registerCommand('terraform.cloud.run.viewApply', async (apply: ApplyTreeItem) => {
        if (!apply.logReadUrl) {
          await vscode.window.showErrorMessage(`No apply log found for ${apply.id}`);
          return;
        }
        await vscode.commands.executeCommand('setContext', 'terraform.cloud.run.viewingApply', true);
        await vscode.commands.executeCommand('terraform.cloud.run.apply.focus');
        this.applySelected.fire(apply);
      }),
    );
  }

  async resolveTreeItem(item: vscode.TreeItem, element: TFCRunTreeItem): Promise<vscode.TreeItem> {
    if (element instanceof RunTreeItem) {
      item.tooltip = await this.runMarkdown(element);
    }
    return item;
  }

  refresh(): void {
    this.didChangeTreeData.fire();
  }

  getTreeItem(element: vscode.TreeItem): vscode.TreeItem | Thenable<vscode.TreeItem> {
    return element;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getChildren(element?: any): vscode.ProviderResult<vscode.TreeItem[]> {
    if (element) {
      if (element instanceof WorkspaceTreeItem) {
        return this.getRuns(element as WorkspaceTreeItem);
      }
      if (element instanceof RunTreeItem) {
        return this.getRunDetails(element);
      }
    }

    return this.buildChildren();
  }

  // This resets the internal cache, e.g. after logout
  reset(): void {
    this.nextPage = null;
    this.cache = [];
  }

  private async filterByProject(): Promise<void> {
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
  }

  private async getRuns(workspace: WorkspaceTreeItem): Promise<vscode.TreeItem[]> {
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
        params: { workspace_id: workspace.id },
        queries: {
          'page[size]': 100,
        },
      });

      this.reporter.sendTelemetryEvent('tfc-fetch-runs', undefined, {
        totalCount: runs.meta.pagination['total-count'],
      });

      if (runs.data.length === 0) {
        return [
          {
            label: `No runs found for ${workspace.attributes.name}`,
            tooltip: `No runs found for ${workspace.attributes.name}`,
            contextValue: 'empty',
          },
        ];
      }

      const items: RunTreeItem[] = [];
      for (let index = 0; index < runs.data.length; index++) {
        const run = runs.data[index];
        const runItem = new RunTreeItem(run.id, run.attributes, workspace);

        runItem.contextValue = 'isRun';
        runItem.organizationName = organization;

        runItem.configurationVersionId = run.relationships['configuration-version']?.data?.id;
        runItem.createdByUserId = run.relationships['created-by']?.data?.id;

        runItem.planId = run.relationships.plan?.data?.id;
        runItem.applyId = run.relationships.apply?.data?.id;
        if (runItem.planId || runItem.applyId) {
          runItem.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
        }

        items.push(runItem);
      }

      return items;
    } catch (error) {
      let message = `Failed to list runs in ${workspace.attributes.name} (${workspace.id}): `;

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
          vscode.window.showWarningMessage(
            `Workspace ${workspace.attributes.name} (${workspace.id}) not found, please pick another one`,
          );
          return [];
        }

        if (isErrorFromAlias(apiClient.api, 'listRuns', error)) {
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

  private async getRunDetails(element: RunTreeItem) {
    const items = [];
    const root = element as RunTreeItem;
    if (root.planId) {
      const plan = await apiClient.getPlan({ params: { plan_id: root.planId } });
      if (plan) {
        const status = plan.data.attributes.status;
        const label = status === 'unreachable' ? 'Plan will not run' : `Plan ${status}`;
        const item = new PlanTreeItem(root.planId, label, plan.data.attributes);
        if (status === 'unreachable' || status === 'pending') {
          item.label = label;
        } else {
          if (this.isJsonExpected(plan.data.attributes, root.attributes['terraform-version'])) {
            item.contextValue = 'hasStructuredPlan';
          } else {
            item.contextValue = 'hasRawPlan';
          }
        }
        items.push(item);
      }
    }

    if (root.applyId) {
      const apply = await apiClient.getApply({ params: { apply_id: root.applyId } });
      if (apply) {
        const status = apply.data.attributes.status;
        const label = status === 'unreachable' ? 'Apply will not run' : `Apply ${status}`;
        const item = new ApplyTreeItem(root.applyId, label, apply.data.attributes);
        if (status === 'unreachable' || status === 'pending') {
          item.label = label;
        } else {
          if (this.isJsonExpected(apply.data.attributes, root.attributes['terraform-version'])) {
            item.contextValue = 'hasStructuredApply';
          } else {
            item.contextValue = 'hasRawApply';
          }
        }
        items.push(item);
      }
    }

    return items;
  }

  private isJsonExpected(attributes: PlanAttributes | ApplyAttributes, terraformVersion: string): boolean {
    const jsonSupportedVersion = '> 0.15.2';
    if (!semver.satisfies(terraformVersion, jsonSupportedVersion)) {
      return false;
    }
    return attributes['structured-run-output-enabled'];
  }

  private async buildChildren() {
    try {
      this.cache = [...this.cache, ...(await this.getWorkspaces())];
    } catch (error) {
      return [];
    }

    const items = this.cache.slice(0);
    if (this.nextPage !== null) {
      items.push(new LoadMoreTreeItem());
    }

    return items;
  }

  private async downloadPlanLog(run: PlanTreeItem) {
    if (!run.id) {
      await vscode.window.showErrorMessage(`No plan found for ${run.id}`);
      return;
    }

    const doc = await vscode.workspace.openTextDocument(run.documentUri);
    return await vscode.window.showTextDocument(doc, {
      preview: false,
    });
  }

  private async downloadApplyLog(run: ApplyTreeItem) {
    if (!run.id) {
      await vscode.window.showErrorMessage(`No apply found for ${run.id}`);
      return;
    }

    const doc = await vscode.workspace.openTextDocument(run.documentUri);
    return await vscode.window.showTextDocument(doc, {
      preview: false,
    });
  }

  private async getWorkspaces(): Promise<vscode.TreeItem[]> {
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

  private async runMarkdown(item: RunTreeItem) {
    const markdown: vscode.MarkdownString = new vscode.MarkdownString();

    // to allow image resizing
    markdown.supportHtml = true;
    markdown.supportThemeIcons = true;

    const configurationVersion = item.configurationVersionId
      ? await apiClient.getConfigurationVersion({
          params: {
            configuration_id: item.configurationVersionId,
          },
        })
      : undefined;
    const ingress = configurationVersion?.data.relationships['ingress-attributes']?.data?.id
      ? await apiClient.getIngressAttributes({
          params: {
            configuration_id: configurationVersion.data.id,
          },
        })
      : undefined;

    const createdAtTime = RelativeTimeFormat(item.attributes['created-at']);

    if (item.createdByUserId) {
      const user = await apiClient.getUser({
        params: {
          user_id: item.createdByUserId,
        },
      });

      markdown.appendMarkdown(
        `<img src="${user.data.attributes['avatar-url']}" width="20"> **${user.data.attributes.username}**`,
      );
    } else if (ingress) {
      markdown.appendMarkdown(
        `<img src="${ingress.data.attributes['sender-avatar-url']}" width="20"> **${ingress.data.attributes['sender-username']}**`,
      );
    }

    const triggerReason = TRIGGER_REASON[item.attributes['trigger-reason']];
    const icon = GetRunStatusIcon(item.attributes.status);
    const msg = GetRunStatusMessage(item.attributes.status);

    markdown.appendMarkdown(` ${triggerReason} from ${RUN_SOURCE[item.attributes.source]} ${createdAtTime}`);
    markdown.appendMarkdown(`

-----
_____
| | |
-:|--
| **Run ID**   | \`${item.id}\` |
| **Status** | $(${icon.id}) ${msg} |
`);
    if (ingress && configurationVersion && configurationVersion.data.attributes.source) {
      // Blind shortening like this may not be appropriate
      // due to hash collisions but we just mimic what TFC does here
      // which is fairly safe since it's just UI/text, not URL.
      const shortCommitSha = ingress.data.attributes['commit-sha'].slice(0, 8);

      const cfgSource = CONFIGURATION_SOURCE[configurationVersion.data.attributes.source];
      markdown.appendMarkdown(`| **Configuration** | From ${cfgSource} by <img src="${
        ingress.data.attributes['sender-avatar-url']
      }" width="20"> ${ingress.data.attributes['sender-username']} **Branch** ${
        ingress.data.attributes.branch
      } **Repo** [${ingress.data.attributes.identifier}](${ingress.data.attributes['clone-url']}) |
| **Commit** | [${shortCommitSha}](${ingress.data.attributes['commit-url']}): ${
        ingress.data.attributes['commit-message'].split('\n')[0]
      } |
`);
    } else {
      markdown.appendMarkdown(`| **Configuration** | From ${item.attributes.source} |
`);
    }

    markdown.appendMarkdown(`| **Trigger** | ${triggerReason} |
| **Execution Mode** | ${item.workspace.attributes['execution-mode']} |
`);
    return markdown;
  }

  dispose() {
    //
  }
}
