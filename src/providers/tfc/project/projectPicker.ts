/**
 * Copyright (c) HashiCorp, Inc.
 * SPDX-License-Identifier: MPL-2.0
 */

import * as vscode from 'vscode';
import { apiClient } from '../../../api/terraformCloud';
import { APIResource } from '../apiPicker';
import { handleAuthError } from '../helpers';
import { handleZodiosError } from '../helpers';
import TelemetryReporter from '@vscode/extension-telemetry';
import { ZodiosError, isErrorFromAlias } from '@zodios/core';
import axios from 'axios';
import { apiErrorsToString } from '../../../api/terraformCloud/errors';
import { ResetProjectItem } from './resetProjectItem';
import { ProjectItem } from './projectItem';

export class ProjectsAPIResource implements APIResource {
  name = 'projects';
  title = 'Filter workspaces';
  placeholder = 'Select a project (type to search)';

  constructor(
    private organizationName: string,
    private outputChannel: vscode.OutputChannel,
    private reporter: TelemetryReporter,
  ) {}

  private async createProjectItems(organization: string, search?: string): Promise<ProjectItem[]> {
    const projects = await apiClient.listProjects({
      params: {
        organization_name: organization,
      },
      // Include query parameter only if search argument is passed
      ...(search && {
        queries: {
          q: search,
        },
      }),
    });

    return projects.data.map((project) => new ProjectItem(project));
  }

  async fetchItems(query?: string): Promise<vscode.QuickPickItem[]> {
    const resetProjectItem = new ResetProjectItem();
    const picks: vscode.QuickPickItem[] = [resetProjectItem, { label: '', kind: vscode.QuickPickItemKind.Separator }];

    try {
      picks.push(...(await this.createProjectItems(this.organizationName, query)));
    } catch (error) {
      let message = 'Failed to fetch projects';

      if (error instanceof ZodiosError) {
        handleZodiosError(error, message, this.outputChannel, this.reporter);
        return picks;
      }

      if (axios.isAxiosError(error) && error.response?.status === 401) {
        handleAuthError();
        return picks;
      } else if (isErrorFromAlias(apiClient.api, 'listProjects', error)) {
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
