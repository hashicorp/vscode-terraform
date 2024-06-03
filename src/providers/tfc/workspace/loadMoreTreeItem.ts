import * as vscode from 'vscode';

export class LoadMoreTreeItem extends vscode.TreeItem {
  constructor() {
    super('Load more...', vscode.TreeItemCollapsibleState.None);

    this.iconPath = new vscode.ThemeIcon('ellipsis', new vscode.ThemeColor('charts.gray'));
    this.command = {
      command: 'terraform.cloud.workspaces.loadMore',
      title: 'Load more',
    };
  }
}
