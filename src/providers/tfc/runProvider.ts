import * as vscode from 'vscode';
import { WorkspaceTreeItem } from './workspaceProvider';

export class RunTreeDataProvider implements vscode.TreeDataProvider<vscode.TreeItem>, vscode.Disposable {
  private readonly didChangeTreeData = new vscode.EventEmitter<void | vscode.TreeItem>();
  public readonly onDidChangeTreeData = this.didChangeTreeData.event;

  constructor(private ctx: vscode.ExtensionContext) {}

  refresh(workspace?: WorkspaceTreeItem): void {
    this.didChangeTreeData.fire();
  }

  getTreeItem(element: vscode.TreeItem): vscode.TreeItem | Thenable<vscode.TreeItem> {
    return element;
  }

  getChildren(element?: vscode.TreeItem | undefined): vscode.ProviderResult<vscode.TreeItem[]> {
    return element ? [element] : [];
  }

  dispose() {
    //
  }
}
