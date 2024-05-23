/**
 * Copyright (c) HashiCorp, Inc.
 * SPDX-License-Identifier: MPL-2.0
 */

import { makeParameters } from '@zodios/core';
import { z } from 'zod';

export const paginationParams = makeParameters([
  {
    name: 'page[number]',
    type: 'Query',
    description: 'Page number',
    schema: z.number().positive().optional(),
  },
  {
    name: 'page[size]',
    type: 'Query',
    description: 'Count of records',
    schema: z.number().positive().optional(),
  },
]);

export const paginationMeta = z.object({
  'current-page': z.number(),
  'page-size': z.number(),
  'next-page': z.number().nullable(),
  'prev-page': z.number().nullable(),
  'total-count': z.number(),
  'total-pages': z.number(),
});
