import * as vscode from 'vscode';

export class RefreshOrganizationItem implements vscode.QuickPickItem {
  get label() {
    return '$(refresh) Refresh organizations';
  }
  get detail() {
    return 'Refetch all organizations';
  }
  get alwaysShow() {
    return true;
  }
}
