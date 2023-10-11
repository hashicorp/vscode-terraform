/**
 * Copyright (c) HashiCorp, Inc.
 * SPDX-License-Identifier: MPL-2.0
 */

import { makeApi } from '@zodios/core';
import { z } from 'zod';

export const CONFIGURATION_SOURCE: { [id: string]: string } = {
  ado: 'Azure DevOps',
  bitbucket: 'Bitbucket',
  gitlab: 'GitLab',
  github: 'GitHub',
  terraform: 'Terraform',
  'terraform+cloud': 'Terraform Cloud',
  tfeAPI: 'API',
  'tfe-api': 'API',
  module: 'No-code Module',
};
const cfgSources = Object.keys(CONFIGURATION_SOURCE) as [string, ...string[]];

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

const configurationVersionRelationships = z.object({
  'ingress-attributes': relationship,
});

// include=configuration_version (implied from .ingress_attributes too)
// See https://developer.hashicorp.com/terraform/cloud-docs/api-docs/configuration-versions#show-a-configuration-version
const configurationVersionAttributes = z.object({
  source: z.enum(cfgSources).nullish(),
});
export type ConfigurationVersionAttributes = z.infer<typeof configurationVersionAttributes>;
const configurationVersion = z.object({
  id: z.string(),
  type: z.literal('configuration-versions'),
  attributes: configurationVersionAttributes,
  relationships: configurationVersionRelationships,
});
export type ConfigurationVersion = z.infer<typeof configurationVersion>;

export const configurationVersionEndpoints = makeApi([
  {
    method: 'get',
    path: '/configuration-versions/:configuration_id',
    alias: 'getConfigurationVersion',
    description: 'Show details of a specific configurationVersion',
    response: z.object({ data: configurationVersion }),
  },
]);
