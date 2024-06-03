import * as vscode from 'vscode';
import { Change, DriftSummary } from '../../../api/terraformCloud/log';
import { ItemWithChildren } from '../logHelpers';
import { DriftChangeItem } from './driftChangeItem';

export class DriftChangesItem extends vscode.TreeItem implements ItemWithChildren {
  constructor(private driftChanges: Change[], summary?: DriftSummary) {
    let label = `Drifted resources`;
    if (summary) {
      const details = [];
      if (summary.changed > 0) {
        details.push(`${summary.changed} changed`);
      }
      if (summary.deleted > 0) {
        details.push(`${summary.deleted} deleted`);
      }
      label = `Drifted resources: ${details.join(', ')}`;
    }

    super(label, vscode.TreeItemCollapsibleState.Expanded);
  }

  getChildren(): vscode.TreeItem[] {
    return this.driftChanges.map((change) => new DriftChangeItem(change));
  }
}
