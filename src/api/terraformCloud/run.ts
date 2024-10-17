/**
 * Copyright (c) HashiCorp, Inc.
 * SPDX-License-Identifier: MPL-2.0
 */

import { makeApi, makeParameters } from '@zodios/core';
import { z } from 'zod';
import { paginationMeta, paginationParams } from './pagination';
import { errors } from './errors';

// See https://developer.hashicorp.com/terraform/cloud-docs/api-docs/run#run-states
const runStatus = z.enum([
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

export const TRIGGER_REASON: { [id: string]: string } = {
  unknown: 'unknown',
  manual: 'manually triggered run',
  disabled: 'file change detected in VCS',
  matched: 'file change detected in tracked directory',
  inconclusive: 'unable to detect changed files',
  git_tag: 'automatically triggered run',
};
const triggerReasons = Object.keys(TRIGGER_REASON) as [string, ...string[]];

export const RUN_SOURCE: { [id: string]: string } = {
  terraform: 'CLI',
  'terraform+cloud': 'CLI',
  'tfe-api': 'API',
  'tfe-configuration-version': 'configuration version',
  'tfe-infrastructure-lifecycle': 'infrastructure lifecycle',
  'tfe-module': 'no-code provision',
  'tfe-run-trigger': 'run trigger',
  'tfe-ui': 'UI',
};
const runSources = Object.keys(RUN_SOURCE) as [string, ...string[]];

export const runAttributes = z.object({
  'created-at': z.coerce.date(),
  message: z.string(),
  source: z.enum(runSources),
  status: runStatus,
  'trigger-reason': z.enum(triggerReasons),
  'terraform-version': z.string(),
});
export type RunAttributes = z.infer<typeof runAttributes>;

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

const runRelationships = z.object({
  plan: relationship.optional(),
  apply: relationship.optional(),
  workspace: relationship,
  'configuration-version': relationship,
  'created-by': relationship,
});

// See https://developer.hashicorp.com/terraform/cloud-docs/api-docs/run#get-run-details
const run = z.object({
  id: z.string(),
  attributes: runAttributes,
  relationships: runRelationships,
});
export type Run = z.infer<typeof run>;

const runs = z.object({
  data: z.array(run),
  meta: z.object({
    pagination: paginationMeta,
  }),
});

// See https://developer.hashicorp.com/terraform/cloud-docs/api-docs/run#available-related-resources
const includeParams = makeParameters([
  {
    name: 'include',
    type: 'Query',
    description: 'Related attributes to include',
    schema: z
      .array(
        z.enum([
          'plan',
          'apply',
          'created_by',
          'cost_estimate',
          'configuration_version',
          'configuration_version.ingress_attributes',
        ]),
      )
      .transform((x) => x.join(','))
      .optional(),
  },
]);

export const runEndpoints = makeApi([
  {
    method: 'get',
    path: '/workspaces/:workspace_id/runs',
    alias: 'listRuns',
    description: 'List Runs in a Workspace',
    response: runs,
    parameters: [...paginationParams, ...includeParams],
    errors,
  },
  {
    method: 'get',
    path: '/runs/:run_id',
    alias: 'getRun',
    description: 'Show details of a specific run',
    response: z.object({ data: run }),
    errors,
  },
]);
