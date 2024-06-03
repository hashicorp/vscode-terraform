import * as vscode from 'vscode';
import { GetChangeActionIcon } from '../helpers';
import { AppliedChange } from '../../../api/terraformCloud/log';

export class AppliedChangeItem extends vscode.TreeItem {
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
