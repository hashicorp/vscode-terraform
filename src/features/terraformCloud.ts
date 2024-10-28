/**
 * Copyright (c) HashiCorp, Inc.
 * SPDX-License-Identifier: MPL-2.0
 */

import * as vscode from 'vscode';
import TelemetryReporter from '@vscode/extension-telemetry';

import { WorkspaceTreeDataProvider, WorkspaceTreeItem } from '../providers/tfc/workspaceProvider';
import { RunTreeDataProvider } from '../providers/tfc/runProvider';
import { PlanTreeDataProvider } from '../providers/tfc/planProvider';
import { TerraformCloudAuthenticationProvider } from '../providers/tfc/authenticationProvider';
import {
  CreateOrganizationItem,
  OrganizationAPIResource,
  RefreshOrganizationItem,
} from '../providers/tfc/organizationPicker';
import { APIQuickPick } from '../providers/tfc/uiHelpers';
import { TerraformCloudWebUrl } from '../api/terraformCloud';
import { PlanLogContentProvider } from '../providers/tfc/contentProvider';
import { ApplyTreeDataProvider } from '../providers/tfc/applyProvider';

export class TerraformCloudFeature implements vscode.Disposable {
  private statusBar: OrganizationStatusBar;

  constructor(
    private context: vscode.ExtensionContext,
    private reporter: TelemetryReporter,
    outputChannel: vscode.OutputChannel,
  ) {
    const authProvider = new TerraformCloudAuthenticationProvider(
      context.secrets,
      context,
      this.reporter,
      outputChannel,
    );
    this.context.subscriptions.push(
      vscode.workspace.registerTextDocumentContentProvider('vscode-terraform', new PlanLogContentProvider()),
    );
    this.statusBar = new OrganizationStatusBar(context);

    authProvider.onDidChangeSessions(async (event) => {
      if (event.added && event.added.length > 0) {
        await vscode.commands.executeCommand('terraform.cloud.organization.picker');
        await this.statusBar.show();
      }
      if (event.removed && event.removed.length > 0) {
        await this.statusBar.reset();
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

    const planDataProvider = new PlanTreeDataProvider(this.context, this.reporter, outputChannel);
    const planView = vscode.window.createTreeView('terraform.cloud.run.plan', {
      canSelectMany: false,
      showCollapseAll: true,
      treeDataProvider: planDataProvider,
    });

    const applyDataProvider = new ApplyTreeDataProvider(this.context, this.reporter, outputChannel);
    const applyView = vscode.window.createTreeView('terraform.cloud.run.apply', {
      canSelectMany: false,
      showCollapseAll: true,
      treeDataProvider: applyDataProvider,
    });

    const runDataProvider = new RunTreeDataProvider(
      this.context,
      this.reporter,
      outputChannel,
      planDataProvider,
      applyDataProvider,
    );
    const runView = vscode.window.createTreeView('terraform.cloud.runs', {
      canSelectMany: false,
      showCollapseAll: true,
      treeDataProvider: runDataProvider,
    });

    const workspaceDataProvider = new WorkspaceTreeDataProvider(
      this.context,
      runDataProvider,
      this.reporter,
      outputChannel,
    );
    const workspaceView = vscode.window.createTreeView('terraform.cloud.workspaces', {
      canSelectMany: false,
      showCollapseAll: true,
      treeDataProvider: workspaceDataProvider,
    });
    const organization = this.context.workspaceState.get<string>('terraform.cloud.organization', '');
    workspaceView.title = organization !== '' ? `Workspaces - (${organization})` : 'Workspaces';

    this.context.subscriptions.push(
      runView,
      planView,
      planDataProvider,
      applyView,
      applyDataProvider,
      runDataProvider,
      workspaceDataProvider,
      workspaceView,
    );

    workspaceView.onDidChangeSelection((event) => {
      if (event.selection.length <= 0) {
        return;
      }

      // we don't allow multi-select yet so this will always be one
      const item = event.selection[0];
      if (item instanceof WorkspaceTreeItem) {
        // call the TFC Run provider with the workspace
        runDataProvider.refresh(item);
        planDataProvider.refresh();
        applyDataProvider.refresh();
      }
    });

    // TODO: move this as the login/organization picker is fleshed out
    // where it can handle things better
    vscode.authentication.onDidChangeSessions((e) => {
      // Refresh the workspace list if the user changes session
      if (e.provider.id === TerraformCloudAuthenticationProvider.providerID) {
        workspaceDataProvider.reset();
        workspaceDataProvider.refresh();
        runDataProvider.refresh();
        planDataProvider.refresh();
        applyDataProvider.refresh();
      }
    });

    workspaceView.onDidChangeVisibility(async (event) => {
      if (event.visible) {
        // the view is visible so show the status bar
        await this.statusBar.show();
        await vscode.commands.executeCommand('setContext', 'terraform.cloud.views.visible', true);
      } else {
        // hide statusbar because user isn't looking at our views
        this.statusBar.hide();
        await vscode.commands.executeCommand('setContext', 'terraform.cloud.views.visible', false);
      }
    });

    this.context.subscriptions.push(
      vscode.commands.registerCommand('terraform.cloud.workspaces.picker', async () => {
        this.reporter.sendTelemetryEvent('tfc-new-workspace');
        const organization = this.context.workspaceState.get<string>('terraform.cloud.organization', '');
        if (organization === '') {
          return [];
        }
        const terraformCloudURL = `${TerraformCloudWebUrl}/${organization}/workspaces/new`;
        await vscode.env.openExternal(vscode.Uri.parse(terraformCloudURL));
      }),
      vscode.commands.registerCommand('terraform.cloud.organization.picker', async () => {
        this.reporter.sendTelemetryEvent('tfc-pick-organization');

        const organizationAPIResource = new OrganizationAPIResource(outputChannel, reporter);
        const organizationQuickPick = new APIQuickPick(organizationAPIResource);
        let choice: vscode.QuickPickItem | undefined;

        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        while (true) {
          choice = await organizationQuickPick.pick(false);

          if (choice === undefined) {
            // user exited without answering, so don't do anything
            return;
          } else if (choice instanceof CreateOrganizationItem) {
            this.reporter.sendTelemetryEvent('tfc-pick-organization-create');

            // open the browser an re-run the loop
            await choice.open();
            continue;
          } else if (choice instanceof RefreshOrganizationItem) {
            this.reporter.sendTelemetryEvent('tfc-pick-organization-refresh');
            // re-run the loop
            continue;
          }

          break;
        }

        // user chose an organization so update the statusbar and make sure its visible
        organizationQuickPick.hide();
        await this.statusBar.show(choice.label);
        workspaceView.title = `Workspace - (${choice.label})`;

        // project filter should be cleared on org change
        await vscode.commands.executeCommand('terraform.cloud.workspaces.resetProjectFilter');
        // filter reset will refresh workspaces
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
      title: 'Choose your HCP Terraform Organization',
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
      this.organizationStatusBar.text = `$(account) TFC - ${organization}`;
      await vscode.commands.executeCommand('setContext', 'terraform.cloud.organizationsChosen', true);
    } else {
      await vscode.commands.executeCommand('setContext', 'terraform.cloud.organizationsChosen', false);
    }

    this.organizationStatusBar.show();
  }

  public async reset() {
    await vscode.commands.executeCommand('setContext', 'terraform.cloud.organizationsChosen', false);
    await this.context.workspaceState.update('terraform.cloud.organization', undefined);
    this.organizationStatusBar.text = '';
    this.organizationStatusBar.hide();
  }

  public hide() {
    this.organizationStatusBar.hide();
  }
}
