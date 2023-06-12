/**
 * Copyright (c) HashiCorp, Inc.
 * SPDX-License-Identifier: MPL-2.0
 */

import * as vscode from 'vscode';
import { WorkspaceTreeDataProvider, WorkspaceTreeItem } from '../providers/tfc/workspaceProvider';
import { RunTreeDataProvider } from '../providers/tfc/runProvider';
import { TerraformCloudAuthenticationProvider } from '../providers/authenticationProvider';
import {
  CreateOrganizationItem,
  OrganizationAPIResource,
  RefreshOrganizationItem,
} from '../providers/tfc/organizationPicker';
import { APIQuickPick } from '../utils/uiHelpers';

export class TerraformCloudFeature implements vscode.Disposable {
  private statusBar: OrganizationStatusBar;

  constructor(private context: vscode.ExtensionContext) {
    this.statusBar = new OrganizationStatusBar(context);

    const authProvider = new TerraformCloudAuthenticationProvider(context.secrets, context);
    authProvider.onDidChangeSessions(async (event) => {
      if (event && event.added && event.added.length > 0) {
        await vscode.commands.executeCommand('terraform.cloud.organization.picker');
        this.statusBar.show();
      }
      if (event && event.removed && event.removed.length > 0) {
        this.statusBar.reset();
      }
    });

    context.subscriptions.push(
      vscode.authentication.registerAuthenticationProvider(
        TerraformCloudAuthenticationProvider.providerID,
        TerraformCloudAuthenticationProvider.providerLabel,
        authProvider,
        { supportsMultipleAccounts: false },
      ),
    );

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
        this.statusBar.show();
      } else {
        // hide statusbar because user isn't looking at our views
        this.statusBar.hide();
      }
    });

    this.context.subscriptions.push(
      vscode.commands.registerCommand('terraform.cloud.organization.picker', async () => {
        const organizationAPIResource = new OrganizationAPIResource();
        const organizationQuickPick = new APIQuickPick(organizationAPIResource);
        let choice: vscode.QuickPickItem | undefined;

        // eslint-disable-next-line no-constant-condition
        while (true) {
          choice = await organizationQuickPick.pick(false);

          if (choice === undefined) {
            // user exited without answering, so don't do anything
            return;
          } else if (choice instanceof CreateOrganizationItem) {
            // open the browser an re-run the loop
            choice.open();
            continue;
          } else if (choice instanceof RefreshOrganizationItem) {
            // re-run the loop
            continue;
          }

          break;
        }

        // user chose an organization so update the statusbar and make sure its visible
        organizationQuickPick.hide();
        this.statusBar.show(choice.label);

        // refresh workspaces so they pick up the change
        workspaceDataProvider.refresh();
        runDataProvider.refresh();
      }),
    );
  }

  dispose() {
    this.statusBar.dispose();
  }
}

export class OrganizationStatusBar implements vscode.Disposable {
  private organizationStatusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 0);

  constructor(private context: vscode.ExtensionContext) {
    this.organizationStatusBar.name = 'TFCOrganizationBar';
    this.organizationStatusBar.command = {
      command: 'terraform.cloud.organization.picker',
      title: 'Choose your Terraform Cloud Organization',
    };
  }

  dispose() {
    this.organizationStatusBar.dispose();
  }

  public async show(organization?: string) {
    if (organization) {
      await this.context.workspaceState.update('terraform.cloud.organization', organization);
    } else {
      organization = this.context.workspaceState.get('terraform.cloud.organization', '');
    }

    if (organization) {
      this.organizationStatusBar.text = organization;
    }

    this.organizationStatusBar.show();
  }

  public async reset() {
    await this.context.workspaceState.update('terraform.cloud.organization', undefined);
    this.organizationStatusBar.text = '';
    this.organizationStatusBar.hide();
  }

  public hide() {
    this.organizationStatusBar.hide();
  }
}
