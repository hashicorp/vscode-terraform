/**
 * Copyright (c) HashiCorp, Inc.
 * SPDX-License-Identifier: MPL-2.0
 */

import { makeParameters } from '@zodios/core';
import { z } from 'zod';

export const projectFilterParams = makeParameters([
  {
    name: 'filter[project][id]',
    type: 'Query',
    description: 'Restricts results to workspaces in the specific project',
    schema: z.string().optional(),
  },
]);

export const workspaceIncludeParams = makeParameters([
  {
    name: 'include',
    type: 'Query',
    description: 'Includes related resources for workspaces when specified',
    schema: z
      .array(z.enum(['current_run']))
      .transform((x) => x.join(','))
      .optional(),
  },
]);

export const searchQueryParams = makeParameters([
  {
    name: 'q',
    type: 'Query',
    description: ' A search query string.',
    schema: z.string().optional(),
  },
]);
