/**
 * Copyright (c) HashiCorp, Inc.
 * SPDX-License-Identifier: MPL-2.0
 */

import { makeApi, makeParameters } from '@zodios/core';
import { z } from 'zod';
import { paginationMeta, paginationParams } from './pagination';

const project = z.object({
  id: z.string(),
  attributes: z.object({
    name: z.string(),
  }),
});

export type Project = z.infer<typeof project>;

const projects = z.object({
  data: z.array(project),
  meta: z.object({
    pagination: paginationMeta,
  }),
});

const searchQueryParams = makeParameters([
  {
    name: 'q',
    type: 'Query',
    description: ' A search query string. This query searches projects by name. This search is case-insensitive.',
    schema: z.string().optional(),
  },
]);

export const projectEndpoints = makeApi([
  {
    method: 'get',
    path: '/organizations/:organization_name/projects',
    alias: 'listProjects',
    description: 'List projects in the organization',
    response: projects,
    parameters: [...paginationParams, ...searchQueryParams],
  },
  {
    method: 'get',
    path: '/projects/:project_id',
    alias: 'getProject',
    description: 'Get details on a project',
    response: z.object({
      data: project,
    }),
  },
]);
