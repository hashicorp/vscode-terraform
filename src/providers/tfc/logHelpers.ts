/**
 * Copyright (c) HashiCorp, Inc.
 * SPDX-License-Identifier: MPL-2.0
 */

import * as vscode from 'vscode';
import { Outputs, OutputChange, Diagnostic } from '../../api/terraformCloud/log';
import { GetChangeActionIcon, GetDiagnosticSeverityIcon } from './helpers';

export interface DiagnosticSummary {
  errorCount: number;
  warningCount: number;
}

export interface ItemWithChildren {
  getChildren(): vscode.TreeItem[];
}

export function isItemWithChildren(element: object): element is ItemWithChildren {
  return 'getChildren' in element;
}

export class OutputsItem extends vscode.TreeItem implements ItemWithChildren {
  constructor(private outputs: Outputs) {
    const size = Object.keys(outputs).length;
    super(`${size} outputs`, vscode.TreeItemCollapsibleState.Expanded);
  }

  getChildren(): vscode.TreeItem[] {
    const items: vscode.TreeItem[] = [];
    Object.entries(this.outputs).forEach(([name, change]: [string, OutputChange]) => {
      items.push(new OutputChangeItem(name, change));
    });
    return items;
  }
}

class OutputChangeItem extends vscode.TreeItem {
  constructor(name: string, output: OutputChange) {
    super(name, vscode.TreeItemCollapsibleState.None);
    if (output.action) {
      this.id = 'output/' + output.action + '/' + name;
      this.iconPath = GetChangeActionIcon(output.action);

      this.description = output.action;
      if (output.sensitive) {
        this.description += ' (sensitive)';
      }
    }
  }
}

export class DiagnosticsItem extends vscode.TreeItem implements ItemWithChildren {
  constructor(
    private diagnostics: Diagnostic[],
    summary: DiagnosticSummary,
  ) {
    const labels: string[] = [];
    if (summary.warningCount === 1) {
      labels.push(`1 warning`);
    } else if (summary.warningCount > 1) {
      labels.push(`${summary.warningCount} warnings`);
    }
    if (summary.errorCount === 1) {
      labels.push(`1 error`);
    } else if (summary.errorCount > 1) {
      labels.push(`${summary.errorCount} errors`);
    }
    super(labels.join(', '), vscode.TreeItemCollapsibleState.Expanded);
  }

  getChildren(): vscode.TreeItem[] {
    return this.diagnostics.map((diagnostic) => new DiagnosticItem(diagnostic));
  }
}

export class DiagnosticItem extends vscode.TreeItem {
  constructor(diagnostic: Diagnostic) {
    super(diagnostic.summary, vscode.TreeItemCollapsibleState.None);
    this.description = diagnostic.severity;
    const icon = GetDiagnosticSeverityIcon(diagnostic.severity);
    this.iconPath = icon;

    const tooltip = new vscode.MarkdownString();
    tooltip.supportThemeIcons = true;
    tooltip.appendMarkdown(`$(${icon.id}) **${diagnostic.summary}**\n\n`);
    tooltip.appendMarkdown(diagnostic.detail);
    this.tooltip = tooltip;
  }
}
