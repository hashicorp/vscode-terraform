/**
 * Copyright (c) HashiCorp, Inc.
 * SPDX-License-Identifier: MPL-2.0
 */

import { makeApi } from '@zodios/core';
import { z } from 'zod';
import { paginationMeta, paginationParams } from './pagination';

const project = z.object({
  id: z.string(),
  attributes: z.object({
    name: z.string(),
  }),
});

const projects = z.object({
  data: z.array(project),
  meta: z.object({
    pagination: paginationMeta,
  }),
});

export const projectEndpoints = makeApi([
  {
    method: 'get',
    path: '/organizations/:organization_name/projects',
    alias: 'listProjects',
    description: 'List projects in the organization',
    response: projects,
    parameters: paginationParams,
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
