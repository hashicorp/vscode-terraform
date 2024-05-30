/**
 * Copyright (c) HashiCorp, Inc.
 * SPDX-License-Identifier: MPL-2.0
 */

import * as vscode from 'vscode';
import TelemetryReporter from '@vscode/extension-telemetry';
import { WorkspaceTreeDataProvider } from '../providers/tfc/workspaceProvider';
import { RunTreeDataProvider } from '../providers/tfc/runProvider';
import { PlanTreeDataProvider } from '../providers/tfc/planProvider';
import { TerraformCloudAuthenticationProvider } from '../providers/tfc/authenticationProvider';
import { PlanLogContentProvider } from '../providers/tfc/contentProvider';
import { ApplyTreeDataProvider } from '../providers/tfc/applyProvider';

export class TerraformCloudFeature implements vscode.Disposable {
  private statusBar: OrganizationStatusBar;

  constructor(
    private context: vscode.ExtensionContext,
    private reporter: TelemetryReporter,
    outputChannel: vscode.OutputChannel,
  ) {
    this.statusBar = new OrganizationStatusBar(context);

    const authProvider = new TerraformCloudAuthenticationProvider(
      context.secrets,
      context,
      this.reporter,
      outputChannel,
    );
    authProvider.onDidChangeSessions(async (event) => {
      if (event && event.added && event.added.length > 0) {
        await vscode.commands.executeCommand('terraform.cloud.organization.picker');
        this.statusBar.show();
      }
      if (event && event.removed && event.removed.length > 0) {
        this.statusBar.reset();
      }
    });

    const planLogProvider = vscode.workspace.registerTextDocumentContentProvider(
      'vscode-terraform',
      new PlanLogContentProvider(),
    );
    const planDataProvider = new PlanTreeDataProvider(this.context, this.reporter, outputChannel);
    const applyDataProvider = new ApplyTreeDataProvider(this.context, this.reporter, outputChannel);
    const runDataProvider = new RunTreeDataProvider(
      this.context,
      this.reporter,
      outputChannel,
      planDataProvider,
      applyDataProvider,
    );
    const workspaceDataProvider = new WorkspaceTreeDataProvider(
      this.context,
      planDataProvider,
      applyDataProvider,
      runDataProvider,
      this.reporter,
      outputChannel,
      this.statusBar,
    );

    this.context.subscriptions.push(
      planLogProvider,
      planDataProvider,
      applyDataProvider,
      runDataProvider,
      workspaceDataProvider,
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
