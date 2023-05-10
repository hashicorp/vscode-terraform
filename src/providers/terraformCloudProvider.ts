import * as vscode from 'vscode';
import { apiClient } from '../terraformCloud';

export class ProjectTreeDataProvider implements vscode.TreeDataProvider<ProjectTreeItem>, vscode.Disposable {
  private readonly didChangeTreeData = new vscode.EventEmitter<void | ProjectTreeItem>();
  public readonly onDidChangeTreeData = this.didChangeTreeData.event;

  constructor(private ctx: vscode.ExtensionContext, private workspaceDataProvider: WorkspaceTreeDataProvider) {
    vscode.commands.registerCommand('terraform.cloud.projects.refresh', () => this.refresh());
    const projectView = vscode.window.createTreeView('terraform.cloud.projects', {
      canSelectMany: false,
      showCollapseAll: true,
      treeDataProvider: this,
    });
    projectView.onDidChangeSelection((event) => {
      const projectItem = event.selection[0];
      // call the Workspace View with the selected projectid
      this.workspaceDataProvider.refresh(projectItem.id);
    });
    ctx.subscriptions.push(projectView);
  }

  refresh(): void {
    this.didChangeTreeData.fire();
  }

  getTreeItem(element: ProjectTreeItem): ProjectTreeItem | Thenable<ProjectTreeItem> {
    return element;
  }

  getChildren(element?: ProjectTreeItem | undefined): vscode.ProviderResult<ProjectTreeItem[]> {
    const organization = this.ctx.globalState.get('terraform.cloud.organization', '');

    try {
      return this.getProjects(organization);
    } catch (error) {
      return [];
    }
  }

  private async getProjects(organization: string) {
    if (organization === '') {
      return [];
    }

    const response = await apiClient.listProjects({
      params: {
        organization_name: organization,
      },
    });
    const projects = response.data;
    const items: ProjectTreeItem[] = [];
    for (let index = 0; index < projects.length; index++) {
      const element = projects[index];
      items.push(new ProjectTreeItem(element.attributes.name, element.id));
    }
    return items;
  }

  dispose() {
    //
  }
}

export class WorkspaceTreeDataProvider implements vscode.TreeDataProvider<WorkspaceTreeItem>, vscode.Disposable {
  private readonly didChangeTreeData = new vscode.EventEmitter<void | WorkspaceTreeItem>();
  public readonly onDidChangeTreeData = this.didChangeTreeData.event;

  private projectID = '';

  constructor(private ctx: vscode.ExtensionContext, private runDataProvider: RunTreeDataProvider) {
    const workspaceView = vscode.window.createTreeView('terraform.cloud.workspaces', {
      canSelectMany: false,
      showCollapseAll: true,
      treeDataProvider: this,
    });
    workspaceView.onDidChangeSelection((event) => {
      const workspaceItem = event.selection[0] as WorkspaceTreeItem;

      // call the TFC Run view with the workspaceID
      this.runDataProvider.refresh(workspaceItem);
    });
    vscode.commands.registerCommand('terraform.cloud.workspaces.listAll', () => {
      this.projectID = '';
      // TODO This refreshes the workspace list without a project filter, but still
      // leaves the Project View 'ghost' selected on the last project selected.
      // There isn't a 'unselect' method on TreeView, apparently by design.
      // Following a web search trail lands on https://github.com/microsoft/vscode/issues/48754, among others
      // We could call projectView.reveal(item, { focus: false }), but that requires implementing getParent
      // and having both a reference to projectView as well as the ProjectItem and that seems a bridge too
      // far at the moment.

      this.refresh();
      this.runDataProvider.refresh();
    });
    vscode.commands.registerCommand('terraform.cloud.workspaces.refresh', (item: WorkspaceTreeItem) => {
      // A user activating this may either have selected a project to view, or not.
      // Refresh the current list of workspaces
      // If there is a projectID, use that, otherwise list all
      this.refresh(this.projectID);
      // tell the Runs view to refresh based on the select workspace

      this.runDataProvider.refresh(item);
    });
    ctx.subscriptions.push(workspaceView);
  }

  refresh(projectID?: string): void {
    if (projectID === undefined && this.projectID !== '') {
      this.didChangeTreeData.fire();
    } else {
      this.projectID = projectID ?? '';
      this.didChangeTreeData.fire();
    }
  }

  getTreeItem(element: WorkspaceTreeItem): WorkspaceTreeItem | Thenable<WorkspaceTreeItem> {
    return element;
  }

  getChildren(element?: WorkspaceTreeItem | undefined): vscode.ProviderResult<WorkspaceTreeItem[]> {
    const organization = this.ctx.globalState.get('terraform.cloud.organization', '');
    if (organization === '') {
      return [];
    }

    try {
      return this.getWorkspaces(organization);
    } catch (error) {
      return [];
    }
  }

  private async getWorkspaces(organization: string) {
    // TODO: handle projectid if present better
    let response = undefined;
    if (this.projectID !== '') {
      response = await apiClient.listWorkspaces({
        params: {
          organization_name: organization,
        },
        queries: {
          'filter[project][id]': this.projectID,
        },
      });
    } else {
      response = await apiClient.listWorkspaces({
        params: {
          organization_name: organization,
        },
      });
    }

    const workspaces = response.data;

    const items: WorkspaceTreeItem[] = [];
    for (let index = 0; index < workspaces.length; index++) {
      const element = workspaces[index];
      items.push(new WorkspaceTreeItem(element.attributes.name, element.id));
    }

    return items;
  }

  dispose() {
    //
  }
}

export class RunTreeDataProvider implements vscode.TreeDataProvider<vscode.TreeItem>, vscode.Disposable {
  private readonly didChangeTreeData = new vscode.EventEmitter<void | vscode.TreeItem>();
  public readonly onDidChangeTreeData = this.didChangeTreeData.event;

  private workspace: WorkspaceTreeItem | undefined;

  constructor(private ctx: vscode.ExtensionContext) {
    const runView = vscode.window.createTreeView('terraform.cloud.runs', {
      canSelectMany: false,
      showCollapseAll: true,
      treeDataProvider: this,
    });
    vscode.commands.registerCommand('terraform.cloud.runs.refresh', () => this.refresh());
    vscode.commands.registerCommand('terraform.cloud.runs.openRunInBrowser', (item: RunTreeItem) => {
      // open in browser
      vscode.env.openExternal(vscode.Uri.parse(item.url));
    });
    ctx.subscriptions.push(runView);
  }

  refresh(workspace?: WorkspaceTreeItem): void {
    if (workspace) {
      this.workspace = workspace;
    }
    this.didChangeTreeData.fire();
  }

  getTreeItem(element: vscode.TreeItem): vscode.TreeItem | Thenable<vscode.TreeItem> {
    return element;
  }

  getChildren(element?: vscode.TreeItem | undefined): vscode.ProviderResult<vscode.TreeItem[]> {
    if (this.workspace === undefined) {
      return [];
    }

    try {
      return this.getRuns(this.workspace);
    } catch (error) {
      return [];
    }
  }

  private async getRuns(workspace: WorkspaceTreeItem) {
    const organization = this.ctx.globalState.get('terraform.cloud.organization', '');

    const response = await apiClient.listRuns({
      params: {
        workspace_id: workspace.id,
      },
    });

    const projects = response.data;

    const items: vscode.TreeItem[] = [];
    for (let index = 0; index < projects.length; index++) {
      const element = projects[index];
      const url = `https://app.staging.terraform.io/app/${organization}/workspaces/${workspace.name}/runs/${element.id}`;
      const treeItem = new RunTreeItem(element.attributes.message, element.id, url);
      items.push(treeItem);
    }

    return items;
  }

  dispose() {
    //
  }
}

class ProjectTreeItem extends vscode.TreeItem {
  constructor(public name: string, public id: string) {
    super(name, vscode.TreeItemCollapsibleState.None);
  }
}

class WorkspaceTreeItem extends vscode.TreeItem {
  /**
   * @param id This is the workspaceID as well as the unique ID for the treeitem
   */
  constructor(public name: string, public id: string) {
    super(name, vscode.TreeItemCollapsibleState.None);
  }
}

class RunTreeItem extends vscode.TreeItem {
  constructor(name: string, public id: string, public url: string) {
    super(name, vscode.TreeItemCollapsibleState.None);
  }
}
