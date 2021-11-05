import * as vscode from 'vscode';
import { ClientHandler } from '../clientHandler';

class Provider extends vscode.TreeItem {}

export class ProviderProvider implements vscode.TreeDataProvider<Provider> {
  onDidChangeTreeData?: vscode.Event<void | Provider>;

  constructor(ctx: vscode.ExtensionContext, public handler: ClientHandler) {}

  getTreeItem(element: Provider): vscode.TreeItem | Thenable<vscode.TreeItem> {
    throw new Error('Method not implemented.');
  }

  getChildren(element?: Provider): vscode.ProviderResult<Provider[]> {
    throw new Error('Method not implemented.');
  }

  getParent?(element: Provider): vscode.ProviderResult<Provider> {
    throw new Error('Method not implemented.');
  }

  resolveTreeItem?(
    item: vscode.TreeItem,
    element: Provider,
    token: vscode.CancellationToken,
  ): vscode.ProviderResult<vscode.TreeItem> {
    throw new Error('Method not implemented.');
  }
}
