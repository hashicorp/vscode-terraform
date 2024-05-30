/**
 * Copyright (c) HashiCorp, Inc.
 * SPDX-License-Identifier: MPL-2.0
 */

import { makeApi } from '@zodios/core';
import { z } from 'zod';

export const applyAttributes = z.object({
  'resource-additions': z.number().nullable(),
  'resource-changes': z.number().nullable(),
  'resource-destructions': z.number().nullable(),
  'structured-run-output-enabled': z.boolean(),
  status: z.string(),
  'status-timestamps': z.object({
    'queued-at': z.string().optional(),
    'started-at': z.string().optional(),
    'finished-at': z.string().optional(),
  }),
  'log-read-url': z.string(),
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
