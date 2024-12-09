/**
 * Copyright (c) HashiCorp, Inc.
 * SPDX-License-Identifier: MPL-2.0
 */

import * as vscode from 'vscode';
import axios from 'axios';
import TelemetryReporter from '@vscode/extension-telemetry';
import semver from 'semver';

import { TerraformCloudWebUrl, apiClient } from '../../api/terraformCloud';
import { TerraformCloudAuthenticationProvider } from './authenticationProvider';
import { RUN_SOURCE, RunAttributes, TRIGGER_REASON } from '../../api/terraformCloud/run';
import { WorkspaceTreeItem } from './workspaceProvider';
import { GetPlanApplyStatusIcon, GetRunStatusIcon, GetRunStatusMessage, RelativeTimeFormat } from './helpers';
import { ZodiosError, isErrorFromAlias } from '@zodios/core';
import { apiErrorsToString } from '../../api/terraformCloud/errors';
import { handleAuthError, handleZodiosError } from './uiHelpers';
import { PlanAttributes } from '../../api/terraformCloud/plan';
import { ApplyAttributes } from '../../api/terraformCloud/apply';
import { CONFIGURATION_SOURCE } from '../../api/terraformCloud/configurationVersion';
import { PlanTreeDataProvider } from './planProvider';
import { ApplyTreeDataProvider } from './applyProvider';

export class RunTreeDataProvider implements vscode.TreeDataProvider<TFCRunTreeItem>, vscode.Disposable {
  private readonly didChangeTreeData = new vscode.EventEmitter<undefined | TFCRunTreeItem>();
  public readonly onDidChangeTreeData = this.didChangeTreeData.event;
  private activeWorkspace: WorkspaceTreeItem | undefined;

  constructor(
    private ctx: vscode.ExtensionContext,
    private reporter: TelemetryReporter,
    private outputChannel: vscode.OutputChannel,
    private planDataProvider: PlanTreeDataProvider,
    private applyDataProvider: ApplyTreeDataProvider,
  ) {
    this.ctx.subscriptions.push(
      vscode.commands.registerCommand('terraform.cloud.run.plan.downloadLog', async (run: PlanTreeItem) => {
        await this.downloadPlanLog(run);
      }),
      vscode.commands.registerCommand('terraform.cloud.run.apply.downloadLog', async (run: ApplyTreeItem) =>
        this.downloadApplyLog(run),
      ),
      vscode.commands.registerCommand('terraform.cloud.runs.refresh', () => {
        this.reporter.sendTelemetryEvent('tfc-runs-refresh');
        this.refresh(this.activeWorkspace);
      }),
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
        this.planDataProvider.refresh(plan);
      }),
      vscode.commands.registerCommand('terraform.cloud.run.viewApply', async (apply: ApplyTreeItem) => {
        if (!apply.logReadUrl) {
          await vscode.window.showErrorMessage(`No apply log found for ${apply.id}`);
          return;
        }
        await vscode.commands.executeCommand('setContext', 'terraform.cloud.run.viewingApply', true);
        await vscode.commands.executeCommand('terraform.cloud.run.apply.focus');
        this.applyDataProvider.refresh(apply);
      }),
    );
  }

  refresh(workspaceItem?: WorkspaceTreeItem): void {
    this.activeWorkspace = workspaceItem;
    this.didChangeTreeData.fire(undefined);
  }

  getTreeItem(element: TFCRunTreeItem): vscode.TreeItem | Thenable<TFCRunTreeItem> {
    return element;
  }

  getChildren(element?: TFCRunTreeItem): vscode.ProviderResult<TFCRunTreeItem[]> {
    if (!this.activeWorkspace || !(this.activeWorkspace instanceof WorkspaceTreeItem)) {
      return [];
    }

    if (element) {
      const items = this.getRunDetails(element);
      return items;
    }

    try {
      return this.getRuns(this.activeWorkspace);
    } catch {
      return [];
    }
  }

  async resolveTreeItem(item: vscode.TreeItem, element: TFCRunTreeItem): Promise<vscode.TreeItem> {
    if (element instanceof RunTreeItem) {
      item.tooltip = await runMarkdown(element);
    }
    return item;
  }

  private async getRuns(workspace: WorkspaceTreeItem): Promise<vscode.TreeItem[]> {
    const organization = this.ctx.workspaceState.get<string>('terraform.cloud.organization', '');
    if (organization === '') {
      return [];
    }

    const session = await vscode.authentication.getSession(TerraformCloudAuthenticationProvider.providerID, [], {
      createIfNone: false,
    });

    if (session === undefined) {
      return [];
    }

    if (!this.activeWorkspace) {
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
            label: `No runs found for ${this.activeWorkspace.attributes.name}`,
            tooltip: `No runs found for ${this.activeWorkspace.attributes.name}`,
            contextValue: 'empty',
          },
        ];
      }

      const items: RunTreeItem[] = [];
      for (const run of runs.data) {
        const runItem = new RunTreeItem(run.id, run.attributes, this.activeWorkspace);

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
      let message = `Failed to list runs in ${this.activeWorkspace.attributes.name} (${workspace.id}): `;

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
          vscode.window.showWarningMessage(
            `Workspace ${this.activeWorkspace.attributes.name} (${workspace.id}) not found, please pick another one`,
          );
          return [];
        }

        if (isErrorFromAlias(apiClient.api, 'listRuns', error)) {
          message += apiErrorsToString(error.response.data.errors);
          vscode.window.showErrorMessage(message);
          this.reporter.sendTelemetryErrorEvent('runProviderError', {
            message: message,
            stack: error.stack,
          });
          return [];
        }
      }

      if (error instanceof Error) {
        message += error.message;
        vscode.window.showErrorMessage(message);
        this.reporter.sendTelemetryErrorEvent('runProviderError', {
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

  private async getRunDetails(element: TFCRunTreeItem) {
    const items = [];
    const root = element as RunTreeItem;
    if (root.planId) {
      const plan = await apiClient.getPlan({ params: { plan_id: root.planId } });
      if (plan.data.id) {
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
      if (apply.data.id) {
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

  dispose() {
    //
  }
}

export type TFCRunTreeItem = RunTreeItem | PlanTreeItem | ApplyTreeItem | vscode.TreeItem;

export class RunTreeItem extends vscode.TreeItem {
  public organizationName?: string;
  public configurationVersionId?: string;
  public createdByUserId?: string;

  public planAttributes?: PlanAttributes;
  public planId?: string;

  public applyAttributes?: ApplyAttributes;
  public applyId?: string;

  constructor(
    public id: string,
    public attributes: RunAttributes,
    public workspace: WorkspaceTreeItem,
  ) {
    super(attributes.message, vscode.TreeItemCollapsibleState.None);
    this.id = id;

    this.workspace = workspace;
    this.iconPath = GetRunStatusIcon(attributes.status);
    this.description = `${attributes['trigger-reason']} ${attributes['created-at'].toDateString()}`;
  }

  public get websiteUri(): vscode.Uri {
    return vscode.Uri.parse(
      `${TerraformCloudWebUrl}/${this.organizationName}/workspaces/${this.workspace.attributes.name}/runs/${this.id}`,
    );
  }
}

export class PlanTreeItem extends vscode.TreeItem {
  public logReadUrl = '';

  constructor(
    public id: string,
    public label: string,
    public attributes: PlanAttributes,
  ) {
    super(label);
    this.iconPath = GetPlanApplyStatusIcon(attributes.status);
    this.logReadUrl = attributes['log-read-url'];
  }

  public get documentUri(): vscode.Uri {
    return vscode.Uri.parse(`vscode-terraform://plan/${this.id}`);
  }
}

export class ApplyTreeItem extends vscode.TreeItem {
  public logReadUrl = '';
  constructor(
    public id: string,
    public label: string,
    public attributes: ApplyAttributes,
  ) {
    super(label);
    this.iconPath = GetPlanApplyStatusIcon(attributes.status);
    this.logReadUrl = attributes['log-read-url'];
  }

  public get documentUri(): vscode.Uri {
    return vscode.Uri.parse(`vscode-terraform://apply/${this.id}`);
  }
}

async function runMarkdown(item: RunTreeItem) {
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
  if (ingress && configurationVersion?.data.attributes.source) {
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
