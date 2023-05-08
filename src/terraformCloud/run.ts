/**
 * Copyright (c) HashiCorp, Inc.
 * SPDX-License-Identifier: MPL-2.0
 */

import { makeApi } from '@zodios/core';
import { z } from 'zod';
import { paginationMeta, paginationParams } from './pagination';

const run = z.object({
  id: z.string(),
  attributes: z.object({
    'created-at': z.date(),
    message: z.string(),
    source: z.string(),
    status: z.enum(['']),
    'trigger-reason': z.enum(['']),
  }),
});

const runs = z.object({
  data: z.array(run),
  meta: z.object({
    pagination: paginationMeta,
  }),
});

export const runEndpoints = makeApi([
  {
    method: 'get',
    path: '/workspaces/:workspace_id/runs',
    alias: 'listRuns',
    description: 'List Runs in a Workspace',
    response: runs,
    parameters: paginationParams,
  },
  {
    method: 'get',
    path: '/runs/:run_id',
    alias: 'getRun',
    description: 'Show details of a specific run',
    response: z.object({ data: run }),
  },
]);
