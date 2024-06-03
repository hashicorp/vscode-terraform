import * as vscode from 'vscode';
import { ApplyAttributes } from '../../../api/terraformCloud/apply';
import { GetPlanApplyStatusIcon } from '../helpers';

export class ApplyTreeItem extends vscode.TreeItem {
  public logReadUrl = '';
  constructor(public id: string, public label: string, public attributes: ApplyAttributes) {
    super(label);
    this.iconPath = GetPlanApplyStatusIcon(attributes.status);
    if (attributes) {
      this.logReadUrl = attributes['log-read-url'] ?? '';
    }
  }

  public get documentUri(): vscode.Uri {
    return vscode.Uri.parse(`vscode-terraform://apply/${this.id}`);
  }
}
