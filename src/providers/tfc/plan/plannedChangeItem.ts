import * as vscode from 'vscode';
import { Change } from '../../../api/terraformCloud/log';
import { GetChangeActionIcon } from '../helpers';

export class PlannedChangeItem extends vscode.TreeItem {
  constructor(public change: Change) {
    let label = change.resource.addr;
    if (change.previous_resource) {
      label = `${change.previous_resource.addr} → ${change.resource.addr}`;
    }

    super(label, vscode.TreeItemCollapsibleState.None);
    this.id = change.action + '/' + change.resource.addr;
    this.iconPath = GetChangeActionIcon(change.action);
    this.description = change.action;

    const tooltip = new vscode.MarkdownString();
    if (change.previous_resource) {
      tooltip.appendMarkdown(
        `\`${change.previous_resource.addr}\` planned to _${change.action}_ to \`${change.resource.addr}\``,
      );
    } else if (change.importing) {
      tooltip.appendMarkdown(
        `Planned to _${change.action}_ \`${change.resource.addr}\` (id=\`${change.importing.id}\`)`,
      );
    } else {
      tooltip.appendMarkdown(`Planned to _${change.action}_ \`${change.resource.addr}\``);
    }
    this.tooltip = tooltip;
  }
}
