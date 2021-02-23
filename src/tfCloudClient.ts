import * as vscode from 'vscode';
import { homedir } from 'os';
import { httpsRequest } from './utils';

export class TFCloudClient {
	private credentials = {};
	private _current_runs = [];
	private _workspaces = [];

	async refresh(): Promise<boolean> {
		const homeDir = homedir();
		const login = await vscode.workspace.fs.readFile(vscode.Uri.parse(`${homeDir}/.terraform.d/credentials.tfrc.json`));
		this.credentials = JSON.parse(login.toString()).credentials;

		const memberships = await this.tfcRequest(`/organization-memberships`);
		const organizations = JSON.parse(memberships).data.map(m => m.relationships.organization.data.id);
		// TODO: have some kind of selector for multiple memberships -- or merge them?
		const response = await this.tfcRequest(`/organizations/${organizations[0]}/workspaces?include=current_run`);
		this._workspaces = JSON.parse(response).data;
		this._current_runs = this._workspaces.map(w => w.relationships['current-run'].data).filter(r => r);

		return true;
	}

	async tfcRequest(endpoint: string): Promise<string> {
		if (this.credentials) {
			const source = Object.keys(this.credentials)[0];
			const uri = encodeURI(`https://${source}/api/v2${endpoint}`);
			console.log(uri)
			const options = {
				method: 'GET',
				headers: {
					'Authorization': `Bearer ${this.credentials[source].token}`,
					'Content-Type': 'application/vnd.api+json'
				}
			}
			return httpsRequest(uri, options);
		} else {
			return Promise.reject("No terraform credentials found");
		}
	}

	async runs(workspaceId?: string): Promise<void | Run[]> {
		if (workspaceId) {
			const response = await this.tfcRequest(`/workspaces/${workspaceId}/runs?page[size]=3`);
			const runs = JSON.parse(response).data;
			return runs.map(run => {
				const workspaceId = run.relationships.workspace.data.id;
				return this.toRun(workspaceId, run);
			});
		} else {
			return Promise.all(
				this._current_runs.map(r => {
					return this.tfcRequest(`/runs/${r.id}`);
				})
			).then((response) => {
				const runs = response.map(r => JSON.parse(r));
				return runs.map(r => {
					const run = r.data;
					const workspaceId = run.relationships.workspace.data.id;
					return this.toRun(workspaceId, run);
				});
			})
		}
	}

	workspaces(): Workspace[] {
		return this._workspaces.map(w => this.toWorkspace(w));
	}

	currentRun(workspace): Run {
		const run = workspace.relationships["latest-run"].data;
		return this.toRun(workspace.id, run);
	}

	toRun(workspaceId, run): Run {
		const id = run.id;
		const message = run.attributes.message;
		const status = run.attributes.status;
		const statusTime = run.attributes['status-timestamps'][`${status}-at`];
		const workspace = this._workspaces.find(w => w.id === workspaceId);
		const organization = workspace.relationships.organization.data.id;
		const workspaceName = workspace.attributes.name;
		const link = `https://app.terraform.io/app/${organization}/workspaces/${workspaceName}/runs/${id}`;
		return { workspaceName, id, message, status, statusTime, link };
	}

	toWorkspace(workspace): Workspace {
		const id = workspace.id;
		const name = workspace.attributes.name;
		const organization = workspace.relationships.organization.data.id;
		const link = `https://app.terraform.io/app/${organization}/workspaces/${name}/runs`;
		return { id, name, organization, link }
	}
}

interface Run {
	workspaceName: string,
	id: string,
	message: string,
	status: string,
	statusTime: string,
	link: string
}

interface Workspace {
	id: string,
	name: string,
	organization: string,
	link: string
}