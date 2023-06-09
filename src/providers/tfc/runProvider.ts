/**
 * Copyright (c) HashiCorp, Inc.
 * SPDX-License-Identifier: MPL-2.0
 */

import * as vscode from 'vscode';
import { apiClient } from '../../terraformCloud';
import { TerraformCloudAuthenticationProvider } from '../authenticationProvider';
import axios from 'axios';
import {
  CONFIGURATION_SOURCE,
  ConfigurationVersionAttributes,
  CreatedByAttributes,
  IncludedObject,
  IngressAttributes,
  RUN_SOURCE,
  Run,
  RunAttributes,
  TRIGGER_REASON,
} from '../../terraformCloud/run';
import { WorkspaceTreeItem } from './workspaceProvider';
import { GetRunStatusIcon } from './helpers';
import { z } from 'zod';

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

        const runURL = `${baseUrl}/${orgName}/workspaces/${run.workspace.attributes.name}/runs/${run.id}`;

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

      if (runs.data.length === 0) {
        return [{ label: `No runs found for ${this.activeWorkspace.attributes.name}` }];
      }

      const items: RunTreeItem[] = [];
      for (let index = 0; index < runs.data.length; index++) {
        const run = runs.data[index];
        const runItem = new RunTreeItem(run.id, run.attributes, this.activeWorkspace);

        runItem.createdBy = findCreatedByAttributes(runs.included, run);

        const cfgVersion = findConfigurationVersionAttributes(runs.included, run);
        if (cfgVersion) {
          runItem.configurationVersion = cfgVersion.attributes as ConfigurationVersionAttributes;

          const ingressAttrs = findIngressAttributes(runs.included, cfgVersion);
          runItem.ingressAttributes = ingressAttrs;
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

function findConfigurationVersionAttributes(included: IncludedObject[], run: Run) {
  return included.find(
    (included: IncludedObject) =>
      included.type === 'configuration-versions' && included.id === run.relationships['configuration-version'].data.id,
  );
}

function findCreatedByAttributes(included: IncludedObject[], run: Run) {
  const includedObject = included.find(
    (included: IncludedObject) => included.type === 'users' && included.id === run.relationships['created-by']?.data.id,
  );
  if (includedObject) {
    return includedObject.attributes as CreatedByAttributes;
  }
}

function findIngressAttributes(included: IncludedObject[], cfgVersion: IncludedObject) {
  const includedObject = included.find(
    (included: IncludedObject) =>
      included.type === 'ingress-attributes' && included.id === cfgVersion?.relationships['ingress-attributes'].data.id,
  );
  if (includedObject) {
    return includedObject.attributes as IngressAttributes;
  }
}

export class RunTreeItem extends vscode.TreeItem {
  public createdBy?: CreatedByAttributes;
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

  // TODO(fix): the date does not get parsed as Date via zod schema
  const date = z.coerce.date().parse(item.attributes['created-at']);

  const createdAtTime = relativeTimeFormat(date);

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
  if (item.ingressAttributes && item.configurationVersion) {
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

function relativeTimeFormat(d: Date): string {
  const SECONDS_IN_MINUTE = 60;
  const SECONDS_IN_HOUR = SECONDS_IN_MINUTE * 60;
  const SECONDS_IN_DAY = SECONDS_IN_HOUR * 24;
  const SECONDS_IN_WEEK = SECONDS_IN_DAY * 7;
  const SECONDS_IN_MONTH = SECONDS_IN_DAY * 30;
  const SECONDS_IN_YEAR = SECONDS_IN_DAY * 365;

  const rtf = new Intl.RelativeTimeFormat('en', { style: 'long', numeric: 'auto' });
  const nowSeconds = Date.now() / 1000;
  const seconds = d.getTime() / 1000;
  const diffSeconds = nowSeconds - seconds;

  if (diffSeconds < SECONDS_IN_MINUTE) {
    return rtf.format(-diffSeconds, 'second');
  }
  if (diffSeconds < SECONDS_IN_HOUR) {
    const minutes = Math.round(diffSeconds / SECONDS_IN_MINUTE);
    return rtf.format(-minutes, 'minute');
  }
  if (diffSeconds < SECONDS_IN_DAY) {
    const hours = Math.round(diffSeconds / SECONDS_IN_HOUR);
    return rtf.format(-hours, 'hour');
  }
  if (diffSeconds < SECONDS_IN_WEEK) {
    const days = Math.round(diffSeconds / SECONDS_IN_DAY);
    return rtf.format(-days, 'day');
  }
  if (diffSeconds < SECONDS_IN_MONTH) {
    const weeks = Math.round(diffSeconds / SECONDS_IN_WEEK);
    return rtf.format(-weeks, 'week');
  }
  if (diffSeconds < SECONDS_IN_YEAR) {
    const months = Math.round(diffSeconds / SECONDS_IN_MONTH);
    return rtf.format(-months, 'month');
  }
  const years = diffSeconds / SECONDS_IN_YEAR;
  return rtf.format(-years, 'year');
}
