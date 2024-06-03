import * as vscode from 'vscode';
import { GetChangeActionIcon, GetDriftChangeActionMessage } from '../helpers';
import { Change } from '../../../api/terraformCloud/log';

export class DriftChangeItem extends vscode.TreeItem {
  constructor(public change: Change) {
    let label = change.resource.addr;
    if (change.previous_resource) {
      label = `${change.previous_resource.addr} → ${change.resource.addr}`;
    }

    super(label, vscode.TreeItemCollapsibleState.None);
    this.id = 'drift/' + change.action + '/' + change.resource.addr;
    this.iconPath = GetChangeActionIcon(change.action);
    const message = GetDriftChangeActionMessage(change.action);
    this.description = message;
    this.tooltip = new vscode.MarkdownString(`\`${change.resource.addr}\` _${message}_`);
  }
}
