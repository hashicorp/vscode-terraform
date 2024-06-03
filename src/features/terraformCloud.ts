/**
 * Copyright (c) HashiCorp, Inc.
 * SPDX-License-Identifier: MPL-2.0
 */

import * as vscode from 'vscode';
import TelemetryReporter from '@vscode/extension-telemetry';
import { WorkspaceTreeDataProvider } from '../providers/tfc/workspace/workspaceProvider';
import { PlanTreeDataProvider } from '../providers/tfc/plan/planProvider';
import { TerraformCloudAuthenticationProvider } from '../providers/tfc/auth/authenticationProvider';
import { PlanLogContentProvider } from '../providers/tfc/plan/contentProvider';
import { ApplyTreeDataProvider } from '../providers/tfc/apply/applyProvider';

export class TerraformCloudFeature implements vscode.Disposable {
  private statusBar: OrganizationStatusBar;

  constructor(
    private context: vscode.ExtensionContext,
    private reporter: TelemetryReporter,
    private outputChannel: vscode.OutputChannel,
  ) {
    this.statusBar = new OrganizationStatusBar(context);

    const authProvider = new TerraformCloudAuthenticationProvider(
      context.secrets,
      context,
      this.reporter,
      this.outputChannel,
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
    const planDataProvider = new PlanTreeDataProvider(this.context, this.reporter, this.outputChannel);
    const applyDataProvider = new ApplyTreeDataProvider(this.context, this.reporter, this.outputChannel);
    const workspaceDataProvider = new WorkspaceTreeDataProvider(
      this.context,
      planDataProvider,
      applyDataProvider,
      this.reporter,
      this.outputChannel,
      this.statusBar,
    );

    this.context.subscriptions.push(
      planLogProvider,
      planDataProvider,
      applyDataProvider,
      workspaceDataProvider,
      authProvider,
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
