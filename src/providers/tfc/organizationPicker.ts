/**
 * Copyright (c) HashiCorp, Inc.
 * SPDX-License-Identifier: MPL-2.0
 */

import * as vscode from 'vscode';
import { TerraformCloudWebUrl, apiClient } from '../../terraformCloud';
import { APIResource } from './uiHelpers';
import { Organization } from '../../terraformCloud/organization';

export class CreateOrganizationItem implements vscode.QuickPickItem {
  get label() {
    return '$(add) Create new organization';
  }
  get description() {
    return 'Open the browser to create a new organization';
  }
  async open() {
    await vscode.env.openExternal(vscode.Uri.parse(`https://${TerraformCloudWebUrl}/organizations`));
  }
  get alwaysShow() {
    return true;
  }
}

export class RefreshOrganizationItem implements vscode.QuickPickItem {
  get label() {
    return '$(refresh) Refresh organizations';
  }
  get description() {
    return 'Refetch all organizations';
  }
  get alwaysShow() {
    return true;
  }
}

class OrganizationItem implements vscode.QuickPickItem {
  constructor(protected organization: Organization) {}
  get label() {
    return this.organization.attributes.name;
  }
}

export class OrganizationAPIResource implements APIResource {
  name = 'organizations';
  title = 'Welcome to Terraform Cloud';
  placeholder = 'Choose an organization. Hit enter to select the first organization. (type to search)';
  ignoreFocusOut = true;

  private async createOrganizationItems(search?: string): Promise<OrganizationItem[]> {
    const organizations = await apiClient.listOrganizations({
      // Include query parameter only if search argument is passed
      ...(search && {
        queries: {
          q: search,
        },
      }),
    });

    return organizations.data.map((organization) => new OrganizationItem(organization));
  }

  async fetchItems(query?: string): Promise<vscode.QuickPickItem[]> {
    const createItem = new CreateOrganizationItem();
    const refreshItem = new RefreshOrganizationItem();
    const picks: vscode.QuickPickItem[] = [
      createItem,
      refreshItem,
      { label: '', kind: vscode.QuickPickItemKind.Separator },
    ];

    try {
      picks.push(...(await this.createOrganizationItems(query)));
    } catch (error) {
      let message = 'Failed to fetch organizations';
      if (error instanceof Error) {
        message = error.message;
      } else if (typeof error === 'string') {
        message = error;
      }

      picks.push({ label: `$(error) Error: ${message}`, alwaysShow: true });
      console.error(error);
    }

    return picks;
  }
}
