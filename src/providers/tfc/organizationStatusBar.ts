import * as vscode from "vscode";


export class OrganizationStatusBar implements vscode.Disposable {
  private organizationStatusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 0);

  constructor(private context: vscode.ExtensionContext) {
    this.organizationStatusBar.name = 'TFCOrganizationBar';
    this.organizationStatusBar.command = {
      command: 'terraform.cloud.organization.picker',
      title: 'Choose your HCP Terraform Organization',
    };
  }

  dispose() {
    this.organizationStatusBar.dispose();
  }

  public async show(organization?: string) {
    if (organization) {
      await this.context.workspaceState.update('terraform.cloud.organization', organization);
    } else {
      organization = this.context.workspaceState.get('terraform.cloud.organization', '');
    }

    if (organization) {
      this.organizationStatusBar.text = `$(account) TFC - ${organization}`;
      await vscode.commands.executeCommand('setContext', 'terraform.cloud.organizationsChosen', true);
    } else {
      await vscode.commands.executeCommand('setContext', 'terraform.cloud.organizationsChosen', false);
    }

    this.organizationStatusBar.show();
  }

  public async reset() {
    await vscode.commands.executeCommand('setContext', 'terraform.cloud.organizationsChosen', false);
    await this.context.workspaceState.update('terraform.cloud.organization', undefined);
    this.organizationStatusBar.text = '';
    this.organizationStatusBar.hide();
  }

  public hide() {
    this.organizationStatusBar.hide();
  }
}
