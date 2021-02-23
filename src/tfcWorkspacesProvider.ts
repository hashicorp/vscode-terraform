import * as vscode from 'vscode';
import * as path from 'path';
import { TFCloudClient } from './tfCloudClient';

export class TfcWorkspacesProvider implements vscode.TreeDataProvider<WorkspaceItem> {
	private client: TFCloudClient;
	private status: string;

	private _onDidChangeTreeData: vscode.EventEmitter<WorkspaceItem | undefined | void> = new vscode.EventEmitter<WorkspaceItem | undefined | void>();
	readonly onDidChangeTreeData: vscode.Event<WorkspaceItem | undefined | void> = this._onDidChangeTreeData.event;

	getChildren(element?: WorkspaceItem): Thenable<WorkspaceItem[]> {
		if (!element) {
			return this.getWorkspaces();
		} else if (element.type === "workspaces") {
			return this.getRuns(this.workspaceId(element.name));
		}
	}

	getTreeItem(element: WorkspaceItem): vscode.TreeItem {
		return {
			label: element.name,
			collapsibleState:
				element.type === "workspaces" ?
					vscode.TreeItemCollapsibleState.Collapsed :
					vscode.TreeItemCollapsibleState.None,
			description: element.description,
			tooltip: element.tooltip,
			command: { command: 'tfc.openLink', title: "Open in Terraform Cloud", arguments: [element.link] },
			iconPath: element.iconPath
		};
	}

	async loadData(client: TFCloudClient): Promise<void> {
		this.client = client;
		this.status = "initialized";
		this.refresh();
	}

	private async getWorkspaces(): Promise<WorkspaceItem[]> {
		if (this.status === "initialized") {
			return this.client.workspaces().map(w => this.toWorkspace(w.name, "workspaces", w.organization, w.link));
		} else {
			return [];
		}
	}

	private workspaceId(workspaceName: string): string {
		return this.client.workspaces().find(w => w.name === workspaceName).id;
	}

	private toWorkspace(name: string, type: string, organization: string, link: string): WorkspaceItem {
		return new Workspace(name, type, link, organization);
	}

	private async getRuns(workspaceId?: string): Promise<WorkspaceItem[]> {
		if (this.status === "initialized") {
			const runs = await this.client.runs(workspaceId);
			if (runs) {
				return runs.map(r => this.toRun(r.message, "runs", r.status, r.statusTime, r.link));
			}
		} else {
			return [];
		}
	}

	private toRun(name: string, type: string, link: string, status: string, version: string): WorkspaceItem {
		return new Run(name, type, link, status, version);
	}

	refresh(): void {
		this._onDidChangeTreeData.fire();
	}
}

class WorkspaceItem {
	constructor(readonly name: string, readonly type: string, readonly link: string) { }

	get description() {
		return null;
	}

	get iconPath() {
		return null;
	}

	get tooltip() {
		return null;
	}
}

class Run extends WorkspaceItem {
	constructor(
		readonly name: string,
		readonly type: string,
		readonly link: string,
		private readonly status: string,
		private readonly version: string
	) {
		super(name, type, link);
	}

	get tooltip() {
		return this.version;
	}

	get iconPath() {
		if (this.status === 'errored') {
			return {
				light: path.join(__filename, '..', '..', 'assets', 'error.svg'),
				dark: path.join(__filename, '..', '..', 'assets', 'error.svg')
			};
		}
		if (this.status === 'applied') {
			return {
				light: path.join(__filename, '..', '..', 'assets', 'done.svg'),
				dark: path.join(__filename, '..', '..', 'assets', 'done.svg')
			};
		}
		return {
			light: path.join(__filename, '..', '..', 'assets', 'default.svg'),
			dark: path.join(__filename, '..', '..', 'assets', 'default.svg')
		};
	}
}

class Workspace extends WorkspaceItem {
	constructor(
		readonly name: string,
		readonly type: string,
		readonly link: string,
		private readonly organization: string
	) {
		super(name, type, link);
	}

	get description() {
		return this.organization;
	}

	get command() {
		return { command: 'tfc.openLink', arguments: [], title: "" }
	}
}
