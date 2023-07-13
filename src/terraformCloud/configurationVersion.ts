/**
 * Copyright (c) HashiCorp, Inc.
 * SPDX-License-Identifier: MPL-2.0
 */

import { makeApi } from '@zodios/core';
import { z } from 'zod';

// include=configuration_version.ingress_attributes
// See https://developer.hashicorp.com/terraform/cloud-docs/api-docs/configuration-versions#show-a-configuration-version-s-commit-information
const ingressAttributes = z.object({
  branch: z.string(),
  'clone-url': z.string(),
  'commit-message': z.string(),
  'commit-sha': z.string(),
  'commit-url': z.string(),
  'compare-url': z.string().nullable(),
  identifier: z.string(),
  'is-pull-request': z.boolean(),
  'on-default-branch': z.boolean(),
  'pull-request-number': z.number().nullable(),
  'pull-request-url': z.string().nullable(),
  'pull-request-title': z.string().nullable(),
  'pull-request-body': z.string().nullable(),
  tag: z.string().nullable(),
  'sender-username': z.string(),
  'sender-avatar-url': z.string(),
  'sender-html-url': z.string(),
});
export type IngressAttributes = z.infer<typeof ingressAttributes>;

const ingressAttributesObject = z.object({
  id: z.string(),
  type: z.literal('ingress-attributes'),
  attributes: ingressAttributes,
});
export type IngressAttributesObject = z.infer<typeof ingressAttributesObject>;

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

// function findConfigurationVersionAttributes(included: IncludedObject[], run: Run): ConfigurationVersion | undefined {
//   const includedObject = included.find(
//     (included: IncludedObject) =>
//       included.type === 'configuration-versions' &&
//       included.id === run.relationships['configuration-version']?.data?.id,
//   );
//   if (includedObject) {
//     return includedObject as ConfigurationVersion;
//   }
// }
