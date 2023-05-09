/**
 * Copyright (c) HashiCorp, Inc.
 * SPDX-License-Identifier: MPL-2.0
 */

import { makeApi } from '@zodios/core';
import { z } from 'zod';
import { projectFilterParams } from './filter';
import { paginationMeta, paginationParams } from './pagination';

const executionModes = z.enum(['remote', 'local', 'agent']);

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
  }),
});

const workspaces = z.object({
  data: z.array(workspace),
  meta: z.object({
    pagination: paginationMeta,
  }),
});

export const workspaceEndpoints = makeApi([
  {
    method: 'get',
    path: '/organizations/:organization_name/workspaces',
    alias: 'listWorkspaces',
    description: 'List workspaces in the organization',
    response: workspaces,
    parameters: [...paginationParams, ...projectFilterParams],
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
