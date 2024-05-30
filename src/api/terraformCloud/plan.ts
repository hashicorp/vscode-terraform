/**
 * Copyright (c) HashiCorp, Inc.
 * SPDX-License-Identifier: MPL-2.0
 */

import { makeApi } from '@zodios/core';
import { z } from 'zod';

export const planAttributes = z.object({
  actions: z.object({
    'is-exportable': z.boolean(),
  }),
  'execution-details': z
    .object({
      mode: z.string(),
    })
    .nullable(),
  'has-changes': z.boolean(),
  permissions: z.object({
    'can-export': z.boolean(),
  }),
  'resource-additions': z.number().nullable(),
  'resource-changes': z.number().nullable(),
  'resource-destructions': z.number().nullable(),
  'structured-run-output-enabled': z.boolean(),
  status: z.string(),
  'status-timestamps': z.object({
    'queued-at': z.string().optional(),
    'pending-at': z.string().optional(),
    'started-at': z.string().optional(),
    'finished-at': z.string().optional(),
  }),
  'log-read-url': z.string(),
});
export type PlanAttributes = z.infer<typeof planAttributes>;

export const plan = z.object({
  id: z.string(),
  type: z.literal('plans'),
  attributes: planAttributes,
});
export type Plan = z.infer<typeof plan>;

const planJson = z.object({
  format_version: z.string(),
  terraform_version: z.string(),
});

export const planEndpoints = makeApi([
  {
    method: 'get',
    path: '/plans/:plan_id',
    alias: 'getPlan',
    description: 'Show details of a specific plan',
    response: z.object({ data: plan }),
  },
  {
    method: 'get',
    path: '/plans/:plan_id/json-output',
    alias: 'getPlanJSON',
    description: 'Show JSON details of a specific plan',
    response: z.object({ data: planJson }),
  },
]);
