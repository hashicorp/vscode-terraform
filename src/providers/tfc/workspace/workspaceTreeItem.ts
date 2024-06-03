import * as vscode from 'vscode';
import { RunAttributes } from '../../../api/terraformCloud/run';
import { WorkspaceAttributes } from '../../../api/terraformCloud/workspace';
import { GetRunStatusIcon, GetRunStatusMessage, RelativeTimeFormat } from '../helpers';

export class WorkspaceTreeItem extends vscode.TreeItem {
  /**
   * @param name The Workspace Name
   * @param id This is the workspaceID as well as the unique ID for the treeitem
   * @param projectName The name of the project this workspace is in
   */
  constructor(
    public attributes: WorkspaceAttributes,
    public id: string,
    public projectName: string,
    public organization: string,
    public weblink: vscode.Uri,
    public lastRun?: RunAttributes,
  ) {
    super(attributes.name, vscode.TreeItemCollapsibleState.Collapsed);

    this.description = `[${this.projectName}]`;
    this.iconPath = GetRunStatusIcon(this.lastRun?.status);
    this.contextValue = 'hasLink';

    const lockedTxt = this.attributes.locked ? '$(lock) Locked' : '$(unlock) Unlocked';
    const vscText =
      this.attributes['vcs-repo-identifier'] && this.attributes['vcs-repo']
        ? `$(source-control) [${this.attributes['vcs-repo-identifier']}](${this.attributes['vcs-repo']['repository-http-url']})`
        : '';

    const statusMsg = GetRunStatusMessage(this.lastRun?.status);
    const updatedAt = RelativeTimeFormat(this.attributes['updated-at']);
    const text = `
## $(${this.iconPath.id}) [${this.attributes.name}](${this.weblink})

#### ID: *${this.id}*

Run Status: $(${this.iconPath.id}) ${statusMsg}

${lockedTxt}
___
| | |
--|--
| **Resources**         | ${this.attributes['resource-count']}|
| **Terraform Version** | ${this.attributes['terraform-version']}|
| **Updated**           | ${updatedAt}|

___
| | |
--|--
| ${vscText} | |
| **$(zap) Execution Mode** | ${this.attributes['execution-mode']}|
| **$(gear) Auto Apply**    | ${updatedAt}|
`;

    this.tooltip = new vscode.MarkdownString(text, true);
  }
}
