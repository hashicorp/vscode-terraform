/**
 * Copyright (c) HashiCorp, Inc.
 * SPDX-License-Identifier: MPL-2.0
 */

import { makeApi, makeParameters } from '@zodios/core';
import { z } from 'zod';
import { paginationMeta, paginationParams } from './pagination';

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
const triggerReasons = Object.keys(TRIGGER_REASON);

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
const runSources = Object.keys(RUN_SOURCE);

export const runAttributes = z.object({
  'created-at': z.date(),
  message: z.string(),
  source: z.enum([runSources[0], ...runSources]),
  status: runStatus,
  'trigger-reason': z.enum([triggerReasons[0], ...triggerReasons]),
  'terraform-version': z.string(),
});
export type RunAttributes = z.infer<typeof runAttributes>;

const relationship = z.object({
  data: z.object({
    id: z.string(),
    type: z.string(),
  }),
});

const runRelationships = z.object({
  workspace: relationship,
  'configuration-version': relationship,
  'created-by': relationship.optional(),
});

// See https://developer.hashicorp.com/terraform/cloud-docs/api-docs/run#get-run-details
const run = z.object({
  id: z.string(),
  attributes: runAttributes,
  relationships: runRelationships,
});
export type Run = z.infer<typeof run>;

// include=configuration_version.ingress_attributes
// See https://developer.hashicorp.com/terraform/cloud-docs/api-docs/configuration-versions#show-a-configuration-version-s-commit-information
const ingressAttributes = z.object({
  branch: z.string(),
  'clone-url': z.string(),
  'commit-message': z.string(),
  'commit-sha': z.string(),
  'commit-url': z.string(),
  'compare-url': z.string(),
  identifier: z.string(),
  'is-pull-request': z.boolean(),
  'on-default-branch': z.boolean(),
  'pull-request-number': z.number(),
  'pull-request-url': z.string(),
  'pull-request-title': z.string(),
  'pull-request-body': z.string(),
  tag: z.string().nullable(),
  'sender-username': z.string(),
  'sender-avatar-url': z.string(),
  'sender-html-url': z.string(),
});
export type IngressAttributes = z.infer<typeof ingressAttributes>;

export const CONFIGURATION_SOURCE: { [id: string]: string } = {
  ado: 'Azure DevOps',
  bitbucket: 'Bitbucket',
  gitlab: 'GitLab',
  github: 'GitHub',
  terraform: 'Terraform',
  'terraform+cloud': 'Terraform Cloud',
  tfeAPI: 'API',
  tfeModule: 'No-code Module',
};
const cfgSources = Object.keys(CONFIGURATION_SOURCE);

// include=configuration_version (implied from .ingress_attributes too)
// See https://developer.hashicorp.com/terraform/cloud-docs/api-docs/configuration-versions#show-a-configuration-version
const configurationVersionAttributes = z.object({
  source: z.enum([cfgSources[0], ...cfgSources]),
});
export type ConfigurationVersionAttributes = z.infer<typeof configurationVersionAttributes>;

const createdByAttributes = z.object({
  username: z.string(),
  'is-service-account': z.boolean(),
  'avatar-url': z.string(),
});
export type CreatedByAttributes = z.infer<typeof createdByAttributes>;

const includedObject = z.object({
  id: z.string(),
  type: z.string(),
  attributes: ingressAttributes.or(configurationVersionAttributes).or(createdByAttributes),
  relationships: z.object({
    'ingress-attributes': relationship,
  }),
});
export type IncludedObject = z.infer<typeof includedObject>;

const runs = z.object({
  data: z.array(run),
  included: z.array(includedObject),
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
      .transform((x) => x?.join(','))
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
  },
  {
    method: 'get',
    path: '/runs/:run_id',
    alias: 'getRun',
    description: 'Show details of a specific run',
    response: z.object({ data: run }),
  },
]);
