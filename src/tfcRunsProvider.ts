import * as vscode from 'vscode';
import * as path from 'path';
import { TFCloudClient } from './tfCloudClient';

export class TfcRunsProvider implements vscode.TreeDataProvider<Run> {
	private client: TFCloudClient;
	private status: string;

	private _onDidChangeTreeData: vscode.EventEmitter<Run | undefined | void> = new vscode.EventEmitter<Run | undefined | void>();
	readonly onDidChangeTreeData: vscode.Event<Run | undefined | void> = this._onDidChangeTreeData.event;

	getChildren(element?: Run): Thenable<Run[]> {
		if (!element) {
			return this.getRuns();
		}
	}

	getTreeItem(element: Run): vscode.TreeItem {
		return element;
	}

	async loadData(client: TFCloudClient): Promise<void> {
		this.client = client;
		this.status = "initialized";
		this.refresh();
	}

	private async getRuns(): Promise<Run[]> {
		if (this.status === "initialized") {
			const runs = await this.client.runs();
			if (runs) {
				return runs.map(r => this.toRun(r.message, r.workspaceName, r.status, r.statusTime, r.link));
			}
		} else {
			return [];
		}
	}

	private toRun(id: string, workspace: string, status: string, version: string, link: string): Run {
		return new Run(id, workspace, status, version, link);
	}

	refresh(): void {
		this._onDidChangeTreeData.fire();
	}
}

class Run extends vscode.TreeItem {
	constructor(
		public readonly label: string,
		private workspace: string,
		private status: string,
		private version: string,
		private link: string
	) {
		super(label);

		this.description = this.workspace;
		this.tooltip = this.version;
		this.command = { command: 'tfc.openLink', title: "Open in Terraform Cloud", arguments: [this.link] };
		this.iconPath = this.getIcon();
	}

	private getIcon() {
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