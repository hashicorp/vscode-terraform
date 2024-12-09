/**
 * Copyright (c) HashiCorp, Inc.
 * SPDX-License-Identifier: MPL-2.0
 */

import * as vscode from 'vscode';
import * as readline from 'readline';
import { Writable } from 'stream';
import axios from 'axios';
import TelemetryReporter from '@vscode/extension-telemetry';

import { TerraformCloudAuthenticationProvider } from './authenticationProvider';
import { ZodiosError } from '@zodios/core';
import { handleAuthError, handleZodiosError } from './uiHelpers';
import { GetChangeActionIcon } from './helpers';
import { AppliedChange, ChangeSummary, Diagnostic, LogLine, Outputs } from '../../api/terraformCloud/log';
import { ApplyTreeItem } from './runProvider';
import { OutputsItem, DiagnosticsItem, DiagnosticSummary, ItemWithChildren, isItemWithChildren } from './logHelpers';

export class ApplyTreeDataProvider implements vscode.TreeDataProvider<vscode.TreeItem>, vscode.Disposable {
  private readonly didChangeTreeData = new vscode.EventEmitter<vscode.TreeItem | undefined>();
  public readonly onDidChangeTreeData = this.didChangeTreeData.event;
  private apply: ApplyTreeItem | undefined;

  constructor(
    private ctx: vscode.ExtensionContext,
    private reporter: TelemetryReporter,
    private outputChannel: vscode.OutputChannel,
  ) {
    this.ctx.subscriptions.push(
      vscode.commands.registerCommand('terraform.cloud.run.apply.refresh', () => {
        this.reporter.sendTelemetryEvent('tfc-run-apply-refresh');
        this.refresh(this.apply);
      }),
    );
  }

  refresh(apply?: ApplyTreeItem): void {
    this.apply = apply;
    this.didChangeTreeData.fire(undefined);
  }

  getTreeItem(element: vscode.TreeItem): vscode.TreeItem | Thenable<vscode.TreeItem> {
    return element;
  }

  getChildren(element?: vscode.TreeItem): vscode.ProviderResult<vscode.TreeItem[]> {
    if (!this.apply) {
      return [];
    }

    if (!element) {
      try {
        return this.getRootChildren(this.apply);
      } catch {
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
    if (applyLog?.appliedChanges) {
      items.push(new AppliedChangesItem(applyLog.appliedChanges, applyLog.changeSummary));
    }
    if (applyLog?.outputs && Object.keys(applyLog.outputs).length > 0) {
      items.push(new OutputsItem(applyLog.outputs));
    }
    if (applyLog?.diagnostics && applyLog.diagnosticSummary && applyLog.diagnostics.length > 0) {
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
        } catch {
          // skip any non-JSON lines, like Terraform version output
          continue;
        }
      }

      return applyLog;
    } catch (error) {
      let message = `Failed to obtain apply log from ${apply.logReadUrl}: `;

      if (error instanceof ZodiosError) {
        await handleZodiosError(error, message, this.outputChannel, this.reporter);
        return;
      }

      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          await handleAuthError();
          return;
        }
      }

      if (error instanceof Error) {
        message += error.message;
        vscode.window.showErrorMessage(message);
        this.reporter.sendTelemetryErrorEvent('applyLogError', {
          message: message,
          stack: error.stack,
        });
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

interface ApplyLog {
  appliedChanges?: AppliedChange[];
  changeSummary?: ChangeSummary;
  outputs?: Outputs;
  diagnostics?: Diagnostic[];
  diagnosticSummary?: DiagnosticSummary;
}

class AppliedChangesItem extends vscode.TreeItem implements ItemWithChildren {
  constructor(
    private appliedChanges: AppliedChange[],
    summary?: ChangeSummary,
  ) {
    let label = 'Applied changes';
    if (summary) {
      const labels: string[] = [];
      if (summary.import > 0) {
        labels.push(`${summary.import} imported`);
      }
      if (summary.add > 0) {
        labels.push(`${summary.add} added`);
      }
      if (summary.change > 0) {
        labels.push(`${summary.change} changed`);
      }
      if (summary.remove > 0) {
        labels.push(`${summary.remove} destroyed`);
      }
      if (labels.length > 0) {
        label = `Applied changes: ${labels.join(', ')}`;
      }
    }
    super(label, vscode.TreeItemCollapsibleState.Expanded);
  }

  getChildren(): vscode.TreeItem[] {
    return this.appliedChanges.map((change) => new AppliedChangeItem(change));
  }
}

class AppliedChangeItem extends vscode.TreeItem {
  constructor(public change: AppliedChange) {
    const label = change.resource.addr;

    super(label, vscode.TreeItemCollapsibleState.None);
    this.id = change.action + '/' + change.resource.addr;
    this.iconPath = GetChangeActionIcon(change.action);

    this.description = change.action;
    if (change.id_key && change.id_value) {
      this.description = `${change.id_key}=${change.id_value}`;
    }

    const tooltip = new vscode.MarkdownString();
    tooltip.appendMarkdown(`_${change.action}_ \`${change.resource.addr}\``);
    this.tooltip = tooltip;
  }
}
