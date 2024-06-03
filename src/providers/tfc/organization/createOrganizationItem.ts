import * as vscode from 'vscode';
import { TerraformCloudWebUrl } from '../../../api/terraformCloud';

export class CreateOrganizationItem implements vscode.QuickPickItem {
  get label() {
    return '$(add) Create new organization';
  }
  get detail() {
    return 'Open the browser to create a new organization';
  }
  async open() {
    await vscode.env.openExternal(vscode.Uri.parse(`${TerraformCloudWebUrl}/organizations/new`));
  }
  get alwaysShow() {
    return true;
  }
}
