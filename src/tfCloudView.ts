import * as vscode from 'vscode';
import { TfcRunsProvider } from './tfcRunsProvider';
import { TfcWorkspacesProvider } from './tfcWorkspacesProvider';

export class TFCloudView {
	constructor(context: vscode.ExtensionContext) {
		const runsProvider = new TfcRunsProvider();
		const workspacesProvider = new TfcWorkspacesProvider();
		vscode.window.registerTreeDataProvider("tfcRuns", runsProvider);
		vscode.window.registerTreeDataProvider("tfcWorkspaces", workspacesProvider);
		vscode.commands.registerCommand("tfc.connect", async () => {
			runsProvider.loadData();
			workspacesProvider.loadData();
		});
		vscode.commands.registerCommand("tfc.openLink", async (link) => {
			vscode.env.openExternal(vscode.Uri.parse(link));
		});
	}
}