/**
 * Copyright (c) HashiCorp, Inc.
 * SPDX-License-Identifier: MPL-2.0
 */

import * as vscode from 'vscode';
import { WorkspaceTreeDataProvider, WorkspaceTreeItem } from '../providers/tfc/workspaceProvider';
import { RunTreeDataProvider } from '../providers/tfc/runProvider';
import { TerraformCloudAuthenticationProvider } from '../providers/authenticationProvider';
import { apiClient } from '../terraformCloud';

export class TerraformCloudFeature implements vscode.Disposable {
  private organizationStatusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 0);

  constructor(private context: vscode.ExtensionContext) {
    this.organizationStatusBar.name = 'TFCOrganizationBar';
    this.organizationStatusBar.command = {
      command: 'terraform.cloud.organization.picker',
      title: 'Choose your Terraform Cloud Organization',
    };

    const org = this.context.workspaceState.get('terraform.cloud.organization', '');
    if (org) {
      this.organizationStatusBar.text = org;
      this.organizationStatusBar.show();
    }

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
      if (event.visible) {
        // the view is visible so show the status bar
        this.organizationStatusBar.show();
      } else {
        // hide statusbar because user isn't looking at our views
        this.organizationStatusBar.hide();
      }
    });

    this.context.subscriptions.push(
      vscode.commands.registerCommand('terraform.cloud.organization.picker', async () => {
        const response = await apiClient.listOrganizations();
        const orgs = response.data;

        const items: vscode.QuickPickItem[] = [];
        for (let index = 0; index < orgs.length; index++) {
          const element = orgs[index];
          items.push({
            label: element.attributes.name,
          });
        }

        const answer = await vscode.window.showQuickPick(items, {
          canPickMany: false,
          ignoreFocusOut: true,
          placeHolder: 'Choose an organization. Hit enter to select the first organization.',
          title: 'Welcome to Terraform Cloud',
        });

        if (answer === undefined) {
          // user exited without answering, so don't change
          return;
        }

        // user chose an organization so update the statusbar and make sure its visible
        this.organizationStatusBar.text = answer.label;
        this.organizationStatusBar.show();

        // store the organization so other parts can use it
        this.context.workspaceState.update('terraform.cloud.organization', answer.label);

        // refresh workspaces so they pick up the change
        workspaceDataProvider.refresh();
      }),
    );
  }

  dispose() {
    this.organizationStatusBar.dispose();
  }
}
