import * as vscode from 'vscode';
import { Organization } from '../../../api/terraformCloud/organization';

export class OrganizationItem implements vscode.QuickPickItem {
  constructor(protected organization: Organization) {}
  get label() {
    return this.organization.attributes.name;
  }
}
