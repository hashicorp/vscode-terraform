import * as vscode from 'vscode';
import { AppliedChange, ChangeSummary } from '../../../api/terraformCloud/log';
import { ItemWithChildren } from '../logHelpers';
import { AppliedChangeItem } from './appliedChangeItem';

export class AppliedChangesItem extends vscode.TreeItem implements ItemWithChildren {
  constructor(private appliedChanges: AppliedChange[], summary?: ChangeSummary) {
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
