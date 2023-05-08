/**
 * Copyright (c) HashiCorp, Inc.
 * SPDX-License-Identifier: MPL-2.0
 */

import { Zodios, ZodiosPlugin, makeApi } from '@zodios/core';
import { z } from 'zod';
import { pluginToken, pluginHeader } from '@zodios/plugins';
import { TerraformCloudAuthenticationProvider } from '../providers/authenticationProvider';
import * as vscode from 'vscode';

const defaultHostname = 'app.terraform.io';
const basePath = '/api/v2';

const accountDetails = z.object({
  data: z.object({
    id: z.string(),
    type: z.string(),
    attributes: z.object({
      username: z.string(),
      email: z.string(),
    }),
  }),
});

const accountEndpoints = makeApi([
  {
    method: 'get',
    path: '/account/details',
    alias: 'getUser',
    description: 'Get user details',
    response: accountDetails,
  },
]);

const organizations = z.object({
  data: z.array(
    z.object({
      id: z.string(),
      attributes: z.object({
        'external-id': z.string(),
        name: z.string(),
      }),
    }),
  ),
});

const organizationMemberships = z.object({
  data: z.array(
    z.object({
      id: z.string(),
      attributes: z.object({
        status: z.enum(['active', 'invited']),
      }),
      relationships: z.object({
        organization: z.object({
          data: z.object({
            id: z.string(),
          }),
        }),
      }),
    }),
  ),
});

const organizationEndpoints = makeApi([
  {
    // TODO: pagination
    method: 'get',
    path: '/organizations',
    alias: 'listOrganizations',
    description: 'List organizations of the current user',
    response: organizations,
  },
  {
    method: 'get',
    path: '/organization-memberships',
    alias: 'listOrganizationMemberships',
    description: 'List organization memberships of the current user',
    response: organizationMemberships,
  },
]);

const workspace = z.object({
  data: z.object({
    description: z.string(),
    environment: z.string(),
    'execution-mode': z.enum(['']),
    name: z.string(),
    source: z.string(),
    'updated-at': z.date(),
    'run-failures': z.number(),
  }),
});

const workspaces = z.object({
  data: z.array(
    z.object({
      id: z.string(),
      attributes: z.object({
        description: z.string(),
        environment: z.string(),
        'execution-mode': z.enum(['']),
        name: z.string(),
        source: z.string(),
        'updated-at': z.date(),
        'run-failures': z.number(),
      }),
    }),
  ),
});

const workspaceEndpoints = makeApi([
  {
    // TODO: pagination
    method: 'get',
    path: '/organizations/:organization_name/workspaces',
    alias: 'listWorkspaces',
    description: 'List workspaces in the organization',
    response: workspaces,
  },
  {
    method: 'get',
    path: '/workspaces/:workspace_id',
    alias: 'getWorkspace',
    description: 'Get details on a workspace',
    response: workspace,
  },
]);

const run = z.object({
  data: z.object({
    id: z.string(),
    attributes: z.object({
      'created-at': z.date(),
      message: z.string(),
      source: z.string(),
      status: z.enum(['']),
      'trigger-reason': z.enum(['']),
    }),
  }),
});

const runs = z.object({
  data: z.array(
    z.object({
      id: z.string(),
      attributes: z.object({
        'created-at': z.date(),
        message: z.string(),
        source: z.string(),
        status: z.enum(['']),
        'trigger-reason': z.enum(['']),
      }),
    }),
  ),
});

const runEndpoints = makeApi([
  {
    // TODO: pagination
    method: 'get',
    path: '/workspaces/:workspace_id/runs',
    alias: 'listRuns',
    description: 'List Runs in a Workspace',
    response: runs,
  },
  {
    method: 'get',
    path: '/runs/:run_id',
    alias: 'getRun',
    description: 'Show details of a specific run',
    response: run,
  },
]);

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
