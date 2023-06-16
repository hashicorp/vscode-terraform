/**
 * Copyright (c) HashiCorp, Inc.
 * SPDX-License-Identifier: MPL-2.0
 */

import { makeApi, makeParameters } from '@zodios/core';
import { z } from 'zod';
import { workspaceIncludeParams, projectFilterParams } from './filter';
import { paginationMeta, paginationParams } from './pagination';
import { runAttributes } from './run';
import { errors } from './errors';

const executionModes = z.enum(['remote', 'local', 'agent']);

const included = z.object({
  id: z.string(),
  attributes: runAttributes,
});

const workspaceAttributes = z.object({
  description: z.string().nullable(),
  environment: z.string(),
  'execution-mode': executionModes,
  name: z.string(),
  source: z.string().nullable(),
  'updated-at': z.coerce.date(),
  'run-failures': z.number().nullable(),
  'resource-count': z.number(),
  'terraform-version': z.string(),
  locked: z.boolean(),
  'vcs-repo-identifier': z.string().nullable(),
  'vcs-repo': z
    .object({
      'repository-http-url': z.string(),
    })
    .nullable(),
  'auto-apply': z.boolean(),
});

const relationship = z
  .object({
    data: z
      .object({
        id: z.string(),
        type: z.string(),
      })
      .nullable(),
  })
  .nullish();

const workspaceRelationships = z.object({
  'latest-run': relationship,
  project: relationship,
});

const workspace = z.object({
  id: z.string(),
  attributes: workspaceAttributes,
  relationships: workspaceRelationships,
  links: z.object({
    self: z.string(),
    'self-html': z.string(),
  }),
});

export type Workspace = z.infer<typeof workspace>;
export type WorkspaceAttributes = z.infer<typeof workspaceAttributes>;

const workspaces = z.object({
  data: z.array(workspace),
  meta: z.object({
    pagination: paginationMeta,
  }),
  included: z.array(included).optional(),
});

export const workspaceSortParams = makeParameters([
  {
    name: 'sort',
    type: 'Query',
    description: "Allows sorting the organization's workspaces by a provided value.",
    schema: z
      .enum([
        'name',
        'current-run.created-at',
        'latest-change-at',
        '-name',
        '-current-run.created-at',
        '-latest-change-at',
      ])
      .optional(),
  },
]);

export const workspaceEndpoints = makeApi([
  {
    method: 'get',
    path: '/organizations/:organization_name/workspaces',
    alias: 'listWorkspaces',
    description: 'List workspaces in the organization',
    response: workspaces,
    parameters: [...paginationParams, ...projectFilterParams, ...workspaceIncludeParams, ...workspaceSortParams],
    errors,
  },
  {
    method: 'get',
    path: '/workspaces/:workspace_id',
    alias: 'getWorkspace',
    description: 'Get details on a workspace',
    response: z.object({
      data: workspace,
    }),
    errors,
  },
]);
