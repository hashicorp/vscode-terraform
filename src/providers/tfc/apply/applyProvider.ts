/**
 * Copyright (c) HashiCorp, Inc.
 * SPDX-License-Identifier: MPL-2.0
 */

import * as vscode from 'vscode';
import * as readline from 'readline';
import { Writable } from 'stream';
import axios from 'axios';
import TelemetryReporter from '@vscode/extension-telemetry';

import { TerraformCloudAuthenticationProvider } from '../auth/authenticationProvider';
import { ZodiosError } from '@zodios/core';
import { handleAuthError } from '../helpers';
import { handleZodiosError } from '../helpers';
import { LogLine } from '../../../api/terraformCloud/log';
import { OutputsItem, DiagnosticsItem, isItemWithChildren } from '../logHelpers';
import { ApplyTreeItem } from '../workspace/applyTreeItem';
import { AppliedChangesItem } from './appliedChangesItem';
import { ApplyLog } from './applyLog';

export class ApplyTreeDataProvider implements vscode.TreeDataProvider<vscode.TreeItem>, vscode.Disposable {
  private readonly didChangeTreeData = new vscode.EventEmitter<void | vscode.TreeItem>();
  public readonly onDidChangeTreeData = this.didChangeTreeData.event;
  private apply: ApplyTreeItem | undefined;

  constructor(
    private ctx: vscode.ExtensionContext,
    private reporter: TelemetryReporter,
    private outputChannel: vscode.OutputChannel,
  ) {
    const applyView = vscode.window.createTreeView('terraform.cloud.run.apply', {
      canSelectMany: false,
      showCollapseAll: true,
      treeDataProvider: this,
    });
    // TODO: move this as the login/organization picker is fleshed out
    // where it can handle things better
    vscode.authentication.onDidChangeSessions((e) => {
      // Refresh the workspace list if the user changes session
      if (e.provider.id === TerraformCloudAuthenticationProvider.providerID) {
        this.refresh();
      }
    });
    this.ctx.subscriptions.push(
      applyView,
      vscode.commands.registerCommand('terraform.cloud.run.apply.refresh', () => {
        this.reporter.sendTelemetryEvent('tfc-run-apply-refresh');
        this.refresh(this.apply);
      }),
    );
  }

  refresh(apply?: ApplyTreeItem): void {
    this.apply = apply;
    this.didChangeTreeData.fire();
  }

  getTreeItem(element: vscode.TreeItem): vscode.TreeItem | Thenable<vscode.TreeItem> {
    return element;
  }

  getChildren(element?: vscode.TreeItem | undefined): vscode.ProviderResult<vscode.TreeItem[]> {
    if (!this.apply) {
      return [];
    }

    if (!element) {
      try {
        return this.getRootChildren(this.apply);
      } catch (error) {
        return [];
      }
    }

    if (isItemWithChildren(element)) {
      return element.getChildren();
    }
  }

  private async getRootChildren(apply: ApplyTreeItem): Promise<vscode.TreeItem[]> {
    const applyLog = await this.getApplyFromUrl(apply);

    const items: vscode.TreeItem[] = [];
    if (applyLog && applyLog.appliedChanges) {
      items.push(new AppliedChangesItem(applyLog.appliedChanges, applyLog.changeSummary));
    }
    if (applyLog && applyLog.outputs && Object.keys(applyLog.outputs).length > 0) {
      items.push(new OutputsItem(applyLog.outputs));
    }
    if (applyLog && applyLog.diagnostics && applyLog.diagnosticSummary && applyLog.diagnostics.length > 0) {
      items.push(new DiagnosticsItem(applyLog.diagnostics, applyLog.diagnosticSummary));
    }
    return items;
  }

  private async getApplyFromUrl(apply: ApplyTreeItem): Promise<ApplyLog | undefined> {
    const session = await vscode.authentication.getSession(TerraformCloudAuthenticationProvider.providerID, [], {
      createIfNone: false,
    });

    if (session === undefined) {
      return;
    }

    try {
      const result = await axios.get(apply.logReadUrl, {
        headers: { Accept: 'text/plain' },
        responseType: 'stream',
      });
      const lineStream = readline.createInterface({
        input: result.data,
        output: new Writable(),
      });

      const applyLog: ApplyLog = {};

      for await (const line of lineStream) {
        try {
          const logLine: LogLine = JSON.parse(line);

          if (logLine.type === 'apply_complete' && logLine.hook) {
            if (!applyLog.appliedChanges) {
              applyLog.appliedChanges = [];
            }
            applyLog.appliedChanges.push(logLine.hook);
            continue;
          }
          if (logLine.type === 'change_summary' && logLine.changes) {
            applyLog.changeSummary = logLine.changes;
            continue;
          }
          if (logLine.type === 'outputs' && logLine.outputs) {
            applyLog.outputs = logLine.outputs;
            continue;
          }
          if (logLine.type === 'diagnostic' && logLine.diagnostic) {
            if (!applyLog.diagnostics) {
              applyLog.diagnostics = [];
            }
            if (!applyLog.diagnosticSummary) {
              applyLog.diagnosticSummary = {
                errorCount: 0,
                warningCount: 0,
              };
            }
            applyLog.diagnostics.push(logLine.diagnostic);
            if (logLine.diagnostic.severity === 'warning') {
              applyLog.diagnosticSummary.warningCount += 1;
            }
            if (logLine.diagnostic.severity === 'error') {
              applyLog.diagnosticSummary.errorCount += 1;
            }
            continue;
          }

          // TODO: logLine.type=test_*
        } catch (e) {
          // skip any non-JSON lines, like Terraform version output
          continue;
        }
      }

      return applyLog;
    } catch (error) {
      let message = `Failed to obtain apply log from ${apply.logReadUrl}: `;

      if (error instanceof ZodiosError) {
        handleZodiosError(error, message, this.outputChannel, this.reporter);
        return;
      }

      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          handleAuthError();
          return;
        }
      }

      if (error instanceof Error) {
        message += error.message;
        vscode.window.showErrorMessage(message);
        this.reporter.sendTelemetryException(error);
        return;
      }

      if (typeof error === 'string') {
        message += error;
      }
      vscode.window.showErrorMessage(message);
      return;
    }
  }

  dispose() {
    //
  }
}
