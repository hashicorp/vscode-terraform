/**
 * Copyright (c) HashiCorp, Inc.
 * SPDX-License-Identifier: MPL-2.0
 */

import * as vscode from 'vscode';
import { Zodios, ZodiosPlugin } from '@zodios/core';
import { pluginToken, pluginHeader } from '@zodios/plugins';
import { TerraformCloudAuthenticationProvider } from '../providers/authenticationProvider';
import { accountEndpoints } from './account';
import { organizationEndpoints } from './organization';
import { projectEndpoints } from './project';
import { runEndpoints } from './run';
import { workspaceEndpoints } from './workspace';

const defaultHostname = 'app.terraform.io';
const basePath = '/api/v2';

const jsonHeader = pluginHeader('Content-Type', async () => 'application/vnd.api+json');

// TODO: Consider passing it as a dependency instead of global access?
const extVersion = vscode.extensions.getExtension('hashicorp.terraform')?.packageJSON.version;
const userAgentHeader = pluginHeader(
  'User-Agent',
  async () => `VSCode/${vscode.version} hashicorp.terraform/${extVersion}`,
);

function getBaseURL(): string {
  // TODO: decide where to keep default value?
  const baseUrl = new URL(basePath, `https://${defaultHostname}`);
  const hostname = vscode.workspace.getConfiguration('terraform.cloud').get<string>('hostname');
  if (hostname) {
    baseUrl.hostname = hostname;
  }
  return baseUrl.toString();
}

function pluginBaseURL(baseURLFn: () => Promise<string>): ZodiosPlugin {
  return {
    request: async (_, config) => {
      const baseURL = await baseURLFn();
      return { ...config, baseURL };
    },
  };
}

function pluginLogger(): ZodiosPlugin {
  return {
    request: async (_, config) => {
      console.log(config);
      return { ...config };
    },
  };
}

export const earlyApiClient = new Zodios(getBaseURL(), accountEndpoints);
earlyApiClient.use(jsonHeader);
earlyApiClient.use(userAgentHeader);
earlyApiClient.use(
  pluginBaseURL(async () => {
    return getBaseURL();
  }),
);
earlyApiClient.use(pluginLogger());

export const apiClient = new Zodios(getBaseURL(), [
  ...accountEndpoints,
  ...organizationEndpoints,
  ...projectEndpoints,
  ...workspaceEndpoints,
  ...runEndpoints,
]);
apiClient.use(jsonHeader);
apiClient.use(userAgentHeader);
apiClient.use(
  pluginToken({
    getToken: async () => {
      // TODO: Consider passing it as a dependency instead of global access?
      const session = await vscode.authentication.getSession(TerraformCloudAuthenticationProvider.providerID, [], {
        createIfNone: true,
      });
      return session.accessToken;
    },
  }),
);
