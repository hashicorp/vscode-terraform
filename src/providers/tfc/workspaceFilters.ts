/**
 * Copyright (c) HashiCorp, Inc.
 * SPDX-License-Identifier: MPL-2.0
 */

import * as vscode from 'vscode';
import { apiClient } from '../../terraformCloud';
import { Project } from '../../terraformCloud/project';

export class ResetProjectItem implements vscode.QuickPickItem {
  get label() {
    return '$(clear-all) Clear project filter. Show all workspaces';
  }
  get description() {
    return '';
  }
  get alwaysShow() {
    return true;
  }
}

class ProjectItem implements vscode.QuickPickItem {
  constructor(protected project: Project) {}
  get label() {
    return this.project.attributes.name;
  }
  get description() {
    return this.project.id;
  }
}

async function createProjectItems(organization: string, search?: string): Promise<ProjectItem[]> {
  const projects = await apiClient.listProjects({
    params: {
      organization_name: organization,
    },
    // Include query parameter only if search argument is passed
    ...(search && {
      queries: {
        q: search,
      },
    }),
  });

  return projects.data.map((project) => new ProjectItem(project));
}

export class ProjectQuickPick {
  private quickPick: vscode.QuickPick<vscode.QuickPickItem>;
  private fetchTimerKey: NodeJS.Timeout | undefined;

  constructor(private organizationName: string) {
    this.quickPick = vscode.window.createQuickPick();
    this.quickPick.title = 'Filter Workspaces';
    this.quickPick.placeholder = 'Select a project (type to search)';
    this.quickPick.onDidChangeValue(this.onDidChangeValue, this);
  }

  private onDidChangeValue() {
    clearTimeout(this.fetchTimerKey);
    // Only starts fetching projects after a user stopped typing for 300ms
    this.fetchTimerKey = setTimeout(() => this.fetchProjects.apply(this), 300);
  }

  private async fetchProjects() {
    // TODO?: To further improve performance, we could consider throttling this function
    const resetProjectItem = new ResetProjectItem();
    const picks: vscode.QuickPickItem[] = [resetProjectItem, { label: '', kind: vscode.QuickPickItemKind.Separator }];
    try {
      this.quickPick.busy = true;
      this.quickPick.show();

      picks.push(...(await createProjectItems(this.organizationName, this.quickPick.value)));
    } catch (error) {
      picks.push({ label: `$(error) Error: ${error}`, alwaysShow: true });
      console.error(error);
    } finally {
      this.quickPick.items = picks;
      this.quickPick.busy = false;
    }
  }

  async pick() {
    await this.fetchProjects();

    const project = await new Promise<vscode.QuickPickItem | undefined>((c) => {
      this.quickPick.onDidAccept(() => c(this.quickPick.selectedItems[0]));
      this.quickPick.onDidHide(() => c(undefined));
      this.quickPick.show();
    });
    this.quickPick.hide();

    return project;
  }
}
