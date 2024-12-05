/**
 * Copyright (c) HashiCorp, Inc.
 * SPDX-License-Identifier: MPL-2.0
 */

import * as vscode from 'vscode';
import { Zodios, ZodiosPlugin } from '@zodios/core';
import { pluginToken, pluginHeader, pluginBaseURL } from '@zodios/plugins';
import { TerraformCloudAuthenticationProvider } from '../../providers/tfc/authenticationProvider';
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
import { pingEndpoints } from './instance';

export let TerraformCloudHost = 'app.terraform.io';

export let TerraformCloudAPIUrl = `https://${TerraformCloudHost}/api/v2`;
export let TerraformCloudWebUrl = `https://${TerraformCloudHost}/app`;
export const TerraformCloudUrl = `https://${TerraformCloudHost}`;

// eslint-disable-next-line @typescript-eslint/require-await
const jsonHeader = pluginHeader('Content-Type', async () => 'application/vnd.api+json');

// TODO: Consider passing it as a dependency instead of global access to make testing easier
const extVersion = vscode.extensions.getExtension('hashicorp.terraform')?.packageJSON.version;
const userAgentHeader = pluginHeader(
  'User-Agent',
  // eslint-disable-next-line @typescript-eslint/require-await
  async () => `VSCode/${vscode.version} hashicorp.terraform/${extVersion}`,
);

function pluginLogger(): ZodiosPlugin {
  return {
    // eslint-disable-next-line @typescript-eslint/require-await
    response: async (_api, _config, response) => {
      console.log(response);
      return response;
    },
  };
}

function responseHeaderLogger(): ZodiosPlugin {
  return {
    // eslint-disable-next-line @typescript-eslint/require-await
    response: async (api, config, response) => {
      console.log('Response appname:', response.headers['tfp-appname']);
      console.log('Response api-version:', response.headers['tfp-api-version']);

      response.data = {
        appName: response.headers['tfp-appname'],
        apiVersion: response.headers['tfp-api-version'],
        ...response.data,
      };

      return response;
    },
  };
}

export let pingClient = new Zodios(TerraformCloudAPIUrl, pingEndpoints);

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
      // return session ? session.accessToken : undefined;
      return session.accessToken;
    },
  }),
);

export function setupPingClient(hostname: string) {
  // Hostname setup
  const url = `https://${hostname}/api/v2`;

  pingClient = new Zodios(url, pingEndpoints);
  pingClient.use(jsonHeader);
  pingClient.use(userAgentHeader);
  pingClient.use(pluginLogger());
  pingClient.use(responseHeaderLogger());
}

export function earlySetupForHostname(hostname: string) {
  // Hostname setup
  TerraformCloudHost = hostname;
  TerraformCloudAPIUrl = `https://${TerraformCloudHost}/api/v2`;
  TerraformCloudWebUrl = `https://${TerraformCloudHost}/app`;
  // EarlyApiClient setup
  earlyApiClient.use(pluginBaseURL(TerraformCloudAPIUrl));
}

export function apiSetupForHostName(hostname: string) {
  TerraformCloudHost = hostname;
  TerraformCloudAPIUrl = `https://${TerraformCloudHost}/api/v2`;
  TerraformCloudWebUrl = `https://${TerraformCloudHost}/app`;
  // ApiClient setup
  apiClient.use(pluginBaseURL(TerraformCloudAPIUrl));
}
