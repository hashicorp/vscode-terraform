/**
 * Copyright (c) HashiCorp, Inc.
 * SPDX-License-Identifier: MPL-2.0
 */

import { makeApi } from '@zodios/core';
import { z } from 'zod';
import { paginationMeta, paginationParams } from './pagination';

// See https://developer.hashicorp.com/terraform/cloud-docs/api-docs/run#run-states
const runStates = z.enum([
  'pending',
  'fetching',
  'fetching_completed',
  'pre_plan_running',
  'pre_plan_completed',
  'queuing',
  'plan_queued',
  'planning',
  'planned',
  'cost_estimating',
  'cost_estimated',
  'policy_checking',
  'policy_override',
  'policy_soft_failed',
  'policy_checked',
  'confirmed',
  'post_plan_running',
  'post_plan_completed',
  'planned_and_finished',
  'apply_queued',
  'applying',
  'applied',
  'discarded',
  'errored',
  'canceled',
  'force_canceled',
]);

const triggerReasons = z.enum(['unknown', 'manual', 'disabled', 'matched', 'inconclusive', 'git_tag']);

export const runAttributes = z.object({
  'created-at': z.date(),
  message: z.string(),
  source: z.string(),
  status: runStates,
  'trigger-reason': triggerReasons,
  'terraform-version': z.string(),
});

// See https://developer.hashicorp.com/terraform/cloud-docs/api-docs/run#get-run-details
const run = z.object({
  id: z.string(),
  attributes: runAttributes,
  relationships: z.object({
    workspace: z.object({
      data: z.object({
        id: z.string(),
      }),
    }),
  }),
});

export type RunAttributes = z.infer<typeof runAttributes>;

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
