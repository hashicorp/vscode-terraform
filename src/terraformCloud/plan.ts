/**
 * Copyright (c) HashiCorp, Inc.
 * SPDX-License-Identifier: MPL-2.0
 */

import { makeApi } from '@zodios/core';
import { z } from 'zod';

export const planAttributes = z.object({
  'structured-run-output-enabled': z.boolean().optional(),
  status: z.string(),
  'log-read-url': z.string().optional(),
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
