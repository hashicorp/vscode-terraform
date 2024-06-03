import * as vscode from 'vscode';
import { GetPlanApplyStatusIcon } from '../helpers';
import { PlanAttributes } from '../../../api/terraformCloud/plan';

export class PlanTreeItem extends vscode.TreeItem {
  public logReadUrl = '';

  constructor(public id: string, public label: string, public attributes: PlanAttributes) {
    super(label);
    this.iconPath = GetPlanApplyStatusIcon(attributes.status);
    if (attributes) {
      this.logReadUrl = attributes['log-read-url'] ?? '';
    }
  }

  public get documentUri(): vscode.Uri {
    return vscode.Uri.parse(`vscode-terraform://plan/${this.id}`);
  }
}
