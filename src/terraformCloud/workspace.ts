/**
 * Copyright (c) HashiCorp, Inc.
 * SPDX-License-Identifier: MPL-2.0
 */

import { makeApi } from '@zodios/core';
import { z } from 'zod';
import { workspaceIncludeParams, projectFilterParams } from './filter';
import { paginationMeta, paginationParams } from './pagination';
import { runAttributes } from './run';

const executionModes = z.enum(['remote', 'local', 'agent']);

const included = z.object({
  id: z.string(),
  attributes: runAttributes,
});

const workspace = z.object({
  id: z.string(),
  attributes: z.object({
    description: z.string(),
    environment: z.string(),
    'execution-mode': executionModes,
    name: z.string(),
    source: z.string(),
    'updated-at': z.date(),
    'run-failures': z.number(),
    'resource-count': z.number(),
    'terraform-version': z.string(),
    locked: z.string(),
    'vcs-repo-identifier': z.string(),
    'vcs-repo': z.object({
      'repository-http-url': z.string(),
    }),
    'auto-apply': z.string(),
  }),
  relationships: z.object({
    'latest-run': z.object({
      data: z.object({
        id: z.string(),
        type: z.string(),
      }),
    }),
    project: z.object({
      data: z.object({
        id: z.string(),
        type: z.string(),
      }),
    }),
  }),
  links: z.object({
    self: z.string(),
    'self-html': z.string(),
  }),
});

export type Workspace = z.infer<typeof workspace>;

const workspaces = z.object({
  data: z.array(workspace),
  meta: z.object({
    pagination: paginationMeta,
  }),
  included: z.array(included).optional(),
});

export const workspaceEndpoints = makeApi([
  {
    method: 'get',
    path: '/organizations/:organization_name/workspaces',
    alias: 'listWorkspaces',
    description: 'List workspaces in the organization',
    response: workspaces,
    parameters: [...paginationParams, ...projectFilterParams, ...workspaceIncludeParams],
  },
  {
    method: 'get',
    path: '/workspaces/:workspace_id',
    alias: 'getWorkspace',
    description: 'Get details on a workspace',
    response: z.object({
      data: workspace,
    }),
  },
]);
