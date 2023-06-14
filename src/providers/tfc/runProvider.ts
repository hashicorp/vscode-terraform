/**
 * Copyright (c) HashiCorp, Inc.
 * SPDX-License-Identifier: MPL-2.0
 */

import * as vscode from 'vscode';
import axios from 'axios';
import TelemetryReporter from '@vscode/extension-telemetry';

import { TerraformCloudWebUrl, apiClient } from '../../terraformCloud';
import { TerraformCloudAuthenticationProvider } from '../authenticationProvider';
import {
  CONFIGURATION_SOURCE,
  ConfigurationVersion,
  ConfigurationVersionAttributes,
  UserAttributes,
  IncludedObject,
  IngressAttributes,
  RUN_SOURCE,
  Run,
  RunAttributes,
  TRIGGER_REASON,
} from '../../terraformCloud/run';
import { WorkspaceTreeItem } from './workspaceProvider';
import { GetRunStatusIcon, RelativeTimeFormat } from './helpers';

export class RunTreeDataProvider implements vscode.TreeDataProvider<vscode.TreeItem>, vscode.Disposable {
  private readonly didChangeTreeData = new vscode.EventEmitter<void | vscode.TreeItem>();
  public readonly onDidChangeTreeData = this.didChangeTreeData.event;
  private activeWorkspace: WorkspaceTreeItem | undefined;

  constructor(private ctx: vscode.ExtensionContext, private reporter: TelemetryReporter) {
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
      return this.getRuns(this.activeWorkspace.id);
    } catch (error) {
      return [];
    }
  }

  async resolveTreeItem(item: vscode.TreeItem, element: RunTreeItem): Promise<vscode.TreeItem> {
    item.tooltip = await runMarkdown(element);
    return item;
  }

  private async getRuns(workspaceId: string): Promise<vscode.TreeItem[]> {
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
        params: { workspace_id: workspaceId },
        queries: {
          'page[size]': 100,
          include: ['configuration_version.ingress_attributes', 'created_by'],
        },
      });

      this.reporter.sendTelemetryEvent('tfc-fetch-runs', undefined, {
        totalCount: runs.meta.pagination['total-count'],
      });

      if (runs.data.length === 0) {
        return [{ label: `No runs found for ${this.activeWorkspace.attributes.name}` }];
      }

      const items: RunTreeItem[] = [];
      for (let index = 0; index < runs.data.length; index++) {
        const run = runs.data[index];
        const runItem = new RunTreeItem(run.id, run.attributes, this.activeWorkspace);

        if (runs.included) {
          runItem.createdBy = findCreatedByAttributes(runs.included, run);

          const cfgVersion = findConfigurationVersionAttributes(runs.included, run);
          if (cfgVersion) {
            runItem.configurationVersion = cfgVersion.attributes;

            const ingressAttrs = findIngressAttributes(runs.included, cfgVersion);
            runItem.ingressAttributes = ingressAttrs;
          }
        }
        items.push(runItem);
      }

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

function findConfigurationVersionAttributes(included: IncludedObject[], run: Run): ConfigurationVersion | undefined {
  const includedObject = included.find(
    (included: IncludedObject) =>
      included.type === 'configuration-versions' &&
      included.id === run.relationships['configuration-version']?.data?.id,
  );
  if (includedObject) {
    return includedObject as ConfigurationVersion;
  }
}

function findCreatedByAttributes(included: IncludedObject[], run: Run): UserAttributes | undefined {
  const includedObject = included.find(
    (included: IncludedObject) =>
      included.type === 'users' && included.id === run.relationships['created-by']?.data?.id,
  );
  if (includedObject) {
    return includedObject.attributes as UserAttributes;
  }
}

function findIngressAttributes(included: IncludedObject[], cfgVersion: ConfigurationVersion) {
  const includedObject = included.find(
    (included: IncludedObject) =>
      included.type === 'ingress-attributes' &&
      included.id === cfgVersion.relationships['ingress-attributes']?.data?.id,
  );
  if (includedObject) {
    return includedObject.attributes as IngressAttributes;
  }
}

export class RunTreeItem extends vscode.TreeItem {
  public createdBy?: UserAttributes;
  public configurationVersion?: ConfigurationVersionAttributes;
  public ingressAttributes?: IngressAttributes;

  constructor(public id: string, public attributes: RunAttributes, public workspace: WorkspaceTreeItem) {
    super(attributes.message, vscode.TreeItemCollapsibleState.None);
    this.id = id;

    this.workspace = workspace;
    this.iconPath = GetRunStatusIcon(attributes.status);
    this.description = `${attributes['trigger-reason']} ${attributes['created-at']}`;
  }
}

async function runMarkdown(item: RunTreeItem) {
  const markdown: vscode.MarkdownString = new vscode.MarkdownString();

  // to allow image resizing
  markdown.supportHtml = true;

  const createdAtTime = RelativeTimeFormat(item.attributes['created-at']);

  if (item.createdBy) {
    markdown.appendMarkdown(`<img src="${item.createdBy?.['avatar-url']}" width="20"> **${item.createdBy?.username}**`);
  } else if (item.ingressAttributes) {
    markdown.appendMarkdown(
      `<img src="${item.ingressAttributes['sender-avatar-url']}" width="20"> **${item.ingressAttributes['sender-username']}**`,
    );
  }

  const triggerReason = TRIGGER_REASON[item.attributes['trigger-reason']];

  markdown.appendMarkdown(` ${triggerReason} from ${RUN_SOURCE[item.attributes.source]} ${createdAtTime}`);
  markdown.appendMarkdown(`

-----
_____
| | |
-:|--
| **Run ID**   | \`${item.id}\` |
`);
  if (item.ingressAttributes && item.configurationVersion && item.configurationVersion.source) {
    // Blind shortening like this may not be appropriate
    // due to hash collisions but we just mimic what TFC does here
    // which is fairly safe since it's just UI/text, not URL.
    const shortCommitSha = item.ingressAttributes?.['commit-sha'].slice(0, 8);

    const cfgSource = CONFIGURATION_SOURCE[item.configurationVersion.source];
    markdown.appendMarkdown(`| **Configuration** | From ${cfgSource} by <img src="${
      item.ingressAttributes?.['sender-avatar-url']
    }" width="20"> ${item.ingressAttributes?.['sender-username']} **Branch** ${
      item.ingressAttributes?.branch
    } **Repo** [${item.ingressAttributes?.identifier}](${item.ingressAttributes?.['clone-url']}) |
| **Commit** | [${shortCommitSha}](${item.ingressAttributes?.['commit-url']}): ${
      item.ingressAttributes?.['commit-message'].split('\n')[0]
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
