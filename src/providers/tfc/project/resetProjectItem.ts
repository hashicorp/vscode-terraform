import * as vscode from 'vscode';

export class ResetProjectItem implements vscode.QuickPickItem {
  get label() {
    return '$(clear-all) Clear project filter. Show all workspaces';
  }
  get description() {
    return '';
  }
  get alwaysShow() {
    return true;
  }
}
