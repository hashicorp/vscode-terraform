import * as vscode from 'vscode';
import { Change, ChangeSummary } from '../../../api/terraformCloud/log';
import { ItemWithChildren } from '../logHelpers';
import { PlannedChangeItem } from './plannedChangeItem';

export class PlannedChangesItem extends vscode.TreeItem implements ItemWithChildren {
  constructor(private plannedChanges: Change[], summary?: ChangeSummary) {
    let label = 'Planned changes';
    if (summary) {
      const labels: string[] = [];
      if (summary.import > 0) {
        labels.push(`${summary.import} to import`);
      }
      if (summary.add > 0) {
        labels.push(`${summary.add} to add`);
      }
      if (summary.change > 0) {
        labels.push(`${summary.change} to change`);
      }
      if (summary.remove > 0) {
        labels.push(`${summary.remove} to destroy`);
      }
      if (labels.length > 0) {
        label = `Planned changes: ${labels.join(', ')}`;
      }
    }
    super(label, vscode.TreeItemCollapsibleState.Expanded);
  }

  getChildren(): vscode.TreeItem[] {
    return this.plannedChanges.map((change) => new PlannedChangeItem(change));
  }
}
