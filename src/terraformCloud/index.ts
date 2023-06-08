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

// TODO: Replace with production URL before going live
export const baseUrl = 'https://app.staging.terraform.io/api/v2';

const jsonHeader = pluginHeader('Content-Type', async () => 'application/vnd.api+json');

// TODO: Consider passing it as a dependency instead of global access to make testing easier
const extVersion = vscode.extensions.getExtension('hashicorp.terraform')?.packageJSON.version;
const userAgentHeader = pluginHeader(
  'User-Agent',
  async () => `VSCode/${vscode.version} hashicorp.terraform/${extVersion}`,
);

function pluginLogger(): ZodiosPlugin {
  return {
    request: async (_, config) => {
      console.log(config);
      return { ...config };
    },
  };
}

export const earlyApiClient = new Zodios(baseUrl, accountEndpoints);
earlyApiClient.use(jsonHeader);
earlyApiClient.use(userAgentHeader);
earlyApiClient.use(pluginLogger());

export const apiClient = new Zodios(baseUrl, [
  ...accountEndpoints,
  ...organizationEndpoints,
  ...projectEndpoints,
  ...workspaceEndpoints,
  ...runEndpoints,
]);
apiClient.use(jsonHeader);
apiClient.use(userAgentHeader);

export const tokenPluginId = apiClient.use(
  pluginToken({
    getToken: async () => {
      // TODO: Consider passing it as a dependency instead of global access to make testing easier
      const session = await vscode.authentication.getSession(TerraformCloudAuthenticationProvider.providerID, [], {
        createIfNone: true,
      });
      return session ? session.accessToken : undefined;
    },
  }),
);
