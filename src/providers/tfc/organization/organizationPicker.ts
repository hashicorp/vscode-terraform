/**
 * Copyright (c) HashiCorp, Inc.
 * SPDX-License-Identifier: MPL-2.0
 */

import * as vscode from 'vscode';
import { apiClient } from '../../../api/terraformCloud';
import { APIResource } from '../apiPicker';
import { handleAuthError } from '../helpers';
import { handleZodiosError } from '../helpers';
import { ZodiosError, isErrorFromAlias } from '@zodios/core';
import axios from 'axios';
import { apiErrorsToString } from '../../../api/terraformCloud/errors';
import TelemetryReporter from '@vscode/extension-telemetry';
import { RefreshOrganizationItem } from './refreshOrganizationItem';
import { CreateOrganizationItem } from './createOrganizationItem';
import { OrganizationItem } from './organizationItem';

export class OrganizationAPIResource implements APIResource {
  name = 'organizations';
  title = 'Welcome to HCP Terraform';
  placeholder = 'Choose an organization (type to search)';
  ignoreFocusOut = true;

  constructor(private outputChannel: vscode.OutputChannel, private reporter: TelemetryReporter) {}

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
        handleZodiosError(error, message, this.outputChannel, this.reporter);
        return picks;
      }

      if (axios.isAxiosError(error) && error.response?.status === 401) {
        handleAuthError();
        return picks;
      } else if (isErrorFromAlias(apiClient.api, 'listOrganizations', error)) {
        message += apiErrorsToString(error.response.data.errors);
        this.reporter.sendTelemetryException(error);
      } else if (error instanceof Error) {
        message += error.message;
        this.reporter.sendTelemetryException(error);
      } else if (typeof error === 'string') {
        message += error;
      }

      picks.push({ label: `$(error) ${message}`, alwaysShow: true });
    }

    return picks;
  }
}
