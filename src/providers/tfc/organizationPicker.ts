/**
 * Copyright (c) HashiCorp, Inc.
 * SPDX-License-Identifier: MPL-2.0
 */

import * as vscode from 'vscode';
import { TerraformCloudWebUrl, apiClient } from '../../api/terraformCloud';
import { APIResource, handleAuthError, handleZodiosError } from './uiHelpers';
import { Organization } from '../../api/terraformCloud/organization';
import { ZodiosError, isErrorFromAlias } from '@zodios/core';
import axios from 'axios';
import { apiErrorsToString } from '../../api/terraformCloud/errors';
import TelemetryReporter from '@vscode/extension-telemetry';

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

class OrganizationItem implements vscode.QuickPickItem {
  constructor(protected organization: Organization) {}
  get label() {
    return this.organization.attributes.name;
  }
}

export class OrganizationAPIResource implements APIResource {
  name = 'organizations';
  title = 'Welcome to HCP Terraform';
  placeholder = 'Choose an organization (type to search)';
  ignoreFocusOut = true;

  constructor(
    private outputChannel: vscode.OutputChannel,
    private reporter: TelemetryReporter,
  ) {}

  private async createOrganizationItems(search?: string): Promise<OrganizationItem[]> {
    const organizations = await apiClient.listOrganizations({
      // Include query parameter only if search argument is passed
      ...(search && {
        queries: {
          q: search,
        },
      }),
    });

    if (organizations.data.length <= 0) {
      await vscode.commands.executeCommand('setContext', 'terraform.cloud.organizationsExist', false);
    } else {
      await vscode.commands.executeCommand('setContext', 'terraform.cloud.organizationsExist', true);
    }

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

      if (error instanceof ZodiosError) {
        await handleZodiosError(error, message, this.outputChannel, this.reporter);
        return picks;
      }

      if (axios.isAxiosError(error) && error.response?.status === 401) {
        await handleAuthError();
        return picks;
      } else if (isErrorFromAlias(apiClient.api, 'listOrganizations', error)) {
        message += apiErrorsToString(error.response.data.errors);
        this.reporter.sendTelemetryErrorEvent('orgranizationFetchError', {
          message: message,
          stack: error.stack,
        });
      } else if (error instanceof Error) {
        message += error.message;
        this.reporter.sendTelemetryErrorEvent('orgranizationFetchError', {
          message: message,
          stack: error.stack,
        });
      } else if (typeof error === 'string') {
        message += error;
      }

      picks.push({ label: `$(error) ${message}`, alwaysShow: true });
    }

    return picks;
  }
}
