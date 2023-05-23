import * as vscode from 'vscode';
import { WorkspaceTreeDataProvider, WorkspaceTreeItem } from '../providers/tfc/workspaceProvider';
import { RunTreeDataProvider } from '../providers/tfc/runProvider';
import { TerraformCloudAuthenticationProvider } from '../providers/authenticationProvider';

export class TerraformCloudFeature implements vscode.Disposable {
  constructor(private context: vscode.ExtensionContext) {
    const runDataProvider = new RunTreeDataProvider(this.context);
    const runView = vscode.window.createTreeView('terraform.cloud.runs', {
      canSelectMany: false,
      showCollapseAll: true,
      treeDataProvider: runDataProvider,
    });

    const workspaceDataProvider = new WorkspaceTreeDataProvider(this.context, runDataProvider);
    const workspaceView = vscode.window.createTreeView('terraform.cloud.workspaces', {
      canSelectMany: false,
      showCollapseAll: true,
      treeDataProvider: workspaceDataProvider,
    });

    this.context.subscriptions.push(runView, runDataProvider, workspaceDataProvider, workspaceView);

    workspaceView.onDidChangeSelection((event) => {
      if (event.selection.length <= 0) {
        return;
      }

      // we don't allow multi-select yet so this will always be one
      const workspaceItem = event.selection[0] as WorkspaceTreeItem;

      // call the TFC Run provider with the workspace
      runDataProvider.refresh(workspaceItem);
    });

    // TODO: move this as the login/organization picker is fleshed out
    // where it can handle things better
    vscode.authentication.onDidChangeSessions((e) => {
      // Refresh the workspace list if the user changes session
      if (e.provider.id === TerraformCloudAuthenticationProvider.providerID) {
        workspaceDataProvider.refresh();
        // TODO: determine if we refersh the run view as well
        // or if cascade will handle it
      }
    });

    workspaceView.onDidChangeVisibility((event) => {
      // TODO: change visibility of other parts (like statusbar) when not looking
      // at this panel
    });
  }

  dispose() {
    //
  }
}
