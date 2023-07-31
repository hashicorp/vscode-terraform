/**
 * Copyright (c) HashiCorp, Inc.
 * SPDX-License-Identifier: MPL-2.0
 */

import * as vscode from 'vscode';
import axios from 'axios';
import TelemetryReporter from '@vscode/extension-telemetry';

import { TerraformCloudWebUrl, apiClient } from '../../terraformCloud';
import { TerraformCloudAuthenticationProvider } from '../authenticationProvider';
import { RUN_SOURCE, RunAttributes, TRIGGER_REASON } from '../../terraformCloud/run';
import { WorkspaceTreeItem } from './workspaceProvider';
import { GetPlanApplyStatusIcon, GetRunStatusIcon, GetRunStatusMessage, RelativeTimeFormat } from './helpers';
import { ZodiosError, isErrorFromAlias } from '@zodios/core';
import { apiErrorsToString } from '../../terraformCloud/errors';
import { handleAuthError, handleZodiosError } from './uiHelpers';
import { CONFIGURATION_SOURCE } from '../../terraformCloud/configurationVersion';
import { IngressAttributes } from '../../terraformCloud/ingressAttribute';
import { PlanAttributes } from '../../terraformCloud/plan';
import { ApplyAttributes } from '../../terraformCloud/apply';

export class RunTreeDataProvider
  implements vscode.TreeDataProvider<RunTreeItem | PlanTreeItem | ApplyTreeItem | vscode.TreeItem>, vscode.Disposable
{
  private readonly didChangeTreeData = new vscode.EventEmitter<
    | void
    | vscode.TreeItem
    | RunTreeItem
    | PlanTreeItem
    | ApplyTreeItem
    | (vscode.TreeItem | RunTreeItem | PlanTreeItem | ApplyTreeItem)[]
    | null
    | undefined
  >();
  public readonly onDidChangeTreeData = this.didChangeTreeData.event;
  private activeWorkspace: WorkspaceTreeItem | undefined;

  constructor(
    private ctx: vscode.ExtensionContext,
    private reporter: TelemetryReporter,
    private outputChannel: vscode.OutputChannel,
  ) {
    this.ctx.subscriptions.push(
      vscode.commands.registerCommand('terraform.cloud.runs.refresh', () => {
        this.reporter.sendTelemetryEvent('tfc-runs-refresh');
        this.refresh(this.activeWorkspace);
      }),
    );

    this.ctx.subscriptions.push(
      vscode.commands.registerCommand('terraform.cloud.run.viewInBrowser', (run: RunTreeItem) => {
        const orgName = this.ctx.workspaceState.get('terraform.cloud.organization', '');
        if (orgName === '') {
          return;
        }

        this.reporter.sendTelemetryEvent('tfc-runs-viewInBrowser');
        const runURL = `${TerraformCloudWebUrl}/${orgName}/workspaces/${run.workspace.attributes.name}/runs/${run.id}`;

        vscode.env.openExternal(vscode.Uri.parse(runURL));
      }),
      vscode.commands.registerCommand('terraform.cloud.run.plan.downloadLog', async (plan: PlanTreeItem) => {
        if (!plan.id) {
          await vscode.window.showErrorMessage(`No plan found for ${plan.id}`);
          return;
        }

        const planUri = vscode.Uri.parse(`vscode-terraform://plan/${plan.id}`);
        const doc = await vscode.workspace.openTextDocument(planUri);
        await vscode.window.showTextDocument(doc, {
          preview: false,
        });
      }),
      vscode.commands.registerCommand('terraform.cloud.run.apply.downloadLog', async (apply: ApplyTreeItem) => {
        if (!apply.id) {
          await vscode.window.showErrorMessage(`No apply found for ${apply.id}`);
          return;
        }

        const applyUri = vscode.Uri.parse(`vscode-terraform://apply/${apply.id}`);
        const doc = await vscode.workspace.openTextDocument(applyUri);
        await vscode.window.showTextDocument(doc, {
          preview: false,
        });
      }),
      vscode.commands.registerCommand('terraform.cloud.run.apply.viewInBrowser', (run: RunTreeItem) => {
        const orgName = this.ctx.workspaceState.get('terraform.cloud.organization', '');
        if (orgName === '') {
          return;
        }

        const runURL = `${TerraformCloudWebUrl}/${orgName}/workspaces/${run.workspace.attributes.name}/runs/${run.id}`;
        vscode.env.openExternal(vscode.Uri.parse(runURL));
      }),
    );
  }

  refresh(workspaceItem?: WorkspaceTreeItem): void {
    this.activeWorkspace = workspaceItem;
    this.didChangeTreeData.fire();
  }

  getTreeItem(
    element: vscode.TreeItem | RunTreeItem | PlanTreeItem | ApplyTreeItem,
  ): vscode.TreeItem | Thenable<vscode.TreeItem | RunTreeItem | PlanTreeItem | ApplyTreeItem> {
    return element;
  }

  getChildren(
    element?: RunTreeItem,
  ): vscode.ProviderResult<(vscode.TreeItem | RunTreeItem | PlanTreeItem | ApplyTreeItem)[]> {
    if (element) {
      const items = this.getRunDetails(element);
      return items;
    }
    if (!this.activeWorkspace) {
      return [];
    }

    try {
      return this.getRuns(this.activeWorkspace);
    } catch (error) {
      return [];
    }
  }

  async resolveTreeItem(
    item: vscode.TreeItem,
    element: RunTreeItem | PlanTreeItem | ApplyTreeItem,
  ): Promise<vscode.TreeItem> {
    if (element instanceof RunTreeItem) {
      item.tooltip = await runMarkdown(element);
    }
    return item;
  }

  private async getRuns(
    workspace: WorkspaceTreeItem,
  ): Promise<(vscode.TreeItem | RunTreeItem | PlanTreeItem | ApplyTreeItem)[]> {
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

        runItem.configurationVersionId = run.relationships['configuration-version']?.data?.id;
        runItem.createdByUserId = run.relationships['created-by']?.data?.id;
        runItem.planId = run.relationships.plan?.data?.id;
        runItem.applyId = run.relationships.apply?.data?.id;

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
    if (element.planId) {
      const plan = await apiClient.getPlan({ params: { plan_id: element.planId } });
      if (plan) {
        const status = plan.data.attributes.status;
        const label = status === 'unreachable' ? 'Plan will not run' : `Plan ${status}`;
        const item = new PlanTreeItem(element.planId, label, plan.data.attributes);
        switch (status) {
          case 'unreachable':
            item.label = 'Plan will not run';
            break;
          default:
            item.contextValue = 'hasPlan';
            break;
        }
        items.push(item);
      }
    }

    if (element.applyId) {
      const apply = await apiClient.getApply({ params: { apply_id: element.applyId } });
      if (apply) {
        const status = apply.data.attributes.status;
        const label = status === 'unreachable' ? 'Apply will not run' : `Apply ${status}`;
        const item = new ApplyTreeItem(element.applyId, label, apply.data.attributes);
        switch (status) {
          case 'unreachable':
            item.label = 'Apply will not run';
            break;
          default:
            item.contextValue = 'hasApply';
            break;
        }
        items.push(item);
      }
    }
    return items;
  }

  dispose() {
    //
  }
}

export class RunTreeItem extends vscode.TreeItem {
  public createdByUserId?: string;
  public configurationVersionId?: string;

  public planId?: string;

  public applyId?: string;

  constructor(public id: string, public attributes: RunAttributes, public workspace: WorkspaceTreeItem) {
    super(attributes.message, vscode.TreeItemCollapsibleState.Collapsed);
    this.id = id;

    this.workspace = workspace;
    this.iconPath = GetRunStatusIcon(attributes.status);
    this.description = `${attributes['trigger-reason']} ${attributes['created-at']}`;
  }
}

class PlanTreeItem extends vscode.TreeItem {
  public logReadUrl = '';

  constructor(public id: string, public label: string, public attributes: PlanAttributes) {
    super(label);
    this.iconPath = GetPlanApplyStatusIcon(attributes.status);
    if (attributes) {
      this.logReadUrl = attributes['log-read-url'] ?? '';
    }
  }
}

class ApplyTreeItem extends vscode.TreeItem {
  public logReadUrl = '';
  constructor(public id: string, public label: string, public attributes: ApplyAttributes) {
    super(label);
    this.iconPath = GetPlanApplyStatusIcon(attributes.status);
    if (attributes) {
      this.logReadUrl = attributes['log-read-url'] ?? '';
    }
  }
}

async function runMarkdown(item: RunTreeItem) {
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

  const markdown: vscode.MarkdownString = new vscode.MarkdownString();
  // to allow image resizing
  markdown.supportHtml = true;
  markdown.supportThemeIcons = true;

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
    markdown.appendMarkdown(ingressConfigurationMarkdown(cfgSource, ingress.data.attributes, shortCommitSha));
  } else {
    markdown.appendMarkdown(`| **Configuration** | From ${item.attributes.source} |
`);
  }

  markdown.appendMarkdown(`| **Trigger** | ${triggerReason} |
| **Execution Mode** | ${item.workspace.attributes['execution-mode']} |
`);
  return markdown;
}

function ingressConfigurationMarkdown(
  cfgSource: string,
  ingressAttributes: IngressAttributes,
  shortCommitSha: string,
): string {
  return `| **Configuration** | From ${cfgSource} by <img src="${ingressAttributes['sender-avatar-url']}" width="20"> ${
    ingressAttributes['sender-username']
  } **Branch** ${ingressAttributes.branch} **Repo** [${ingressAttributes.identifier}](${
    ingressAttributes['clone-url']
  }) |
| **Commit** | [${shortCommitSha}](${ingressAttributes['commit-url']}): ${
    ingressAttributes['commit-message'].split('\n')[0]
  } |
`;
}
