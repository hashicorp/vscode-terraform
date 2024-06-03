/**
 * Copyright (c) HashiCorp, Inc.
 * SPDX-License-Identifier: MPL-2.0
 */

import * as vscode from 'vscode';
import { Zodios, ZodiosPlugin } from '@zodios/core';
import { pluginToken, pluginHeader } from '@zodios/plugins';
import { TerraformCloudAuthenticationProvider } from '../../providers/tfc/auth/authenticationProvider';
import { accountEndpoints } from './account';
import { organizationEndpoints } from './organization';
import { projectEndpoints } from './project';
import { runEndpoints } from './run';
import { workspaceEndpoints } from './workspace';
import { planEndpoints } from './plan';
import { applyEndpoints } from './apply';
import { userEndpoints } from './user';
import { configurationVersionEndpoints } from './configurationVersion';
import { ingressAttributesEndpoints } from './ingressAttribute';

export const TerraformCloudHost = 'app.terraform.io';

export const TerraformCloudAPIUrl = `https://${TerraformCloudHost}/api/v2`;
export const TerraformCloudWebUrl = `https://${TerraformCloudHost}/app`;

const jsonHeader = pluginHeader('Content-Type', async () => 'application/vnd.api+json');

// TODO: Consider passing it as a dependency instead of global access to make testing easier
const extVersion = vscode.extensions.getExtension('hashicorp.terraform')?.packageJSON.version;
const userAgentHeader = pluginHeader(
  'User-Agent',
  async () => `VSCode/${vscode.version} hashicorp.terraform/${extVersion}`,
);

function pluginLogger(): ZodiosPlugin {
  return {
    response: async (_api, _config, response) => {
      console.log(response);
      return response;
    },
  };
}

export const earlyApiClient = new Zodios(TerraformCloudAPIUrl, accountEndpoints);
earlyApiClient.use(jsonHeader);
earlyApiClient.use(userAgentHeader);
earlyApiClient.use(pluginLogger());

export const apiClient = new Zodios(TerraformCloudAPIUrl, [
  ...accountEndpoints,
  ...organizationEndpoints,
  ...projectEndpoints,
  ...workspaceEndpoints,
  ...runEndpoints,
  ...planEndpoints,
  ...applyEndpoints,
  ...userEndpoints,
  ...configurationVersionEndpoints,
  ...ingressAttributesEndpoints,
]);
apiClient.use(jsonHeader);
apiClient.use(userAgentHeader);
apiClient.use(pluginLogger());

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
