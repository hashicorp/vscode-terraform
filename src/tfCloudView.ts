import * as vscode from 'vscode';
import { TFCloudClient } from './tfCloudClient';
import { TfcRunsProvider } from './tfcRunsProvider';
import { TfcWorkspacesProvider } from './tfcWorkspacesProvider';

export class TFCloudView {
	constructor(context: vscode.ExtensionContext) {
		const client = new TFCloudClient();
		const runsProvider = new TfcRunsProvider();
		const workspacesProvider = new TfcWorkspacesProvider();

		vscode.commands.registerCommand("tfc.connect", async () => {
			client.refresh().then(() => {
				vscode.window.registerTreeDataProvider("tfcRuns", runsProvider);
				vscode.window.registerTreeDataProvider("tfcWorkspaces", workspacesProvider);
				runsProvider.loadData(client);
				workspacesProvider.loadData(client);
			});
		});
		vscode.commands.registerCommand("tfc.openLink", async (link) => {
			vscode.env.openExternal(vscode.Uri.parse(link));
		});
		vscode.commands.registerCommand("tfc.refresh", async () => {
			client.refresh().then(() => {
				runsProvider.loadData(client);
				workspacesProvider.loadData(client);
			});
		})
	}
}