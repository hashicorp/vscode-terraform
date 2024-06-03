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
import { PlanTreeItem } from '../providers/tfc/plan/planTreeItem';
import { ApplyTreeItem } from '../providers/tfc/workspace/applyTreeItem';
import { OrganizationStatusBar } from '../providers/tfc/organizationStatusBar';

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
    const workspaceDataProvider = new WorkspaceTreeDataProvider(this.context, this.reporter, this.outputChannel);
    workspaceDataProvider.onDidChangeSelection(async (workspace) => {
      if (workspace) {
        planDataProvider.refresh();
        applyDataProvider.refresh();
      }
    });
    workspaceDataProvider.onDidChangeTitle(async (title) => {
      this.statusBar.show(title);
    });
    workspaceDataProvider.onDidChangeVisibility(async (visibile) => {
      if (visibile === true) {
        this.statusBar.show();
        await vscode.commands.executeCommand('setContext', 'terraform.cloud.views.visible', true);
      } else {
        this.statusBar.hide();
        await vscode.commands.executeCommand('setContext', 'terraform.cloud.views.visible', false);
      }
    });
    workspaceDataProvider.onDidplanSelected(async (plan: PlanTreeItem) => {
      planDataProvider.refresh(plan);
    });
    workspaceDataProvider.onDidApplySelected(async (apply: ApplyTreeItem) => {
      applyDataProvider.refresh(apply);
    });

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
