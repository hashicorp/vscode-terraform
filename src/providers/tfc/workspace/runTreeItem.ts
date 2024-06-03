import * as vscode from 'vscode';
import { TerraformCloudWebUrl } from '../../../api/terraformCloud';
import { ApplyAttributes } from '../../../api/terraformCloud/apply';
import { PlanAttributes } from '../../../api/terraformCloud/plan';
import { RunAttributes } from '../../../api/terraformCloud/run';
import { GetRunStatusIcon } from '../helpers';
import { WorkspaceTreeItem } from './workspaceTreeItem';

export class RunTreeItem extends vscode.TreeItem {
  public organizationName?: string;
  public configurationVersionId?: string;
  public createdByUserId?: string;

  public planAttributes?: PlanAttributes;
  public planId?: string;

  public applyAttributes?: ApplyAttributes;
  public applyId?: string;

  constructor(public id: string, public attributes: RunAttributes, public workspace: WorkspaceTreeItem) {
    super(attributes.message, vscode.TreeItemCollapsibleState.None);
    this.id = id;

    this.workspace = workspace;
    this.iconPath = GetRunStatusIcon(attributes.status);
    this.description = `${attributes['trigger-reason']} ${attributes['created-at']}`;
  }

  public get websiteUri(): vscode.Uri {
    return vscode.Uri.parse(
      `${TerraformCloudWebUrl}/${this.organizationName}/workspaces/${this.workspace.attributes.name}/runs/${this.id}`,
    );
  }
}
