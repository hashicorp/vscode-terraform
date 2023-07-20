/**
 * Copyright (c) HashiCorp, Inc.
 * SPDX-License-Identifier: MPL-2.0
 */

import { makeApi } from '@zodios/core';
import { z } from 'zod';

export const applyAttributes = z.object({
  status: z.string(),
  'log-read-url': z.string().optional(),
});
export type ApplyAttributes = z.infer<typeof applyAttributes>;

export const apply = z.object({
  id: z.string(),
  type: z.literal('applies'),
  attributes: applyAttributes,
});
export type Apply = z.infer<typeof apply>;

export const applyEndpoints = makeApi([
  {
    method: 'get',
    path: '/applies/:apply_id',
    alias: 'getApply',
    description: 'Show details of a specific apply',
    response: z.object({ data: apply }),
  },
]);
