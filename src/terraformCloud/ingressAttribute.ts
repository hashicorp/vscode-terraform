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

export const ingressAttributesEndpoints = makeApi([
  {
    method: 'get',
    path: '/configuration-versions/:configuration_id/ingress-attributes',
    alias: 'getIngressAttributes',
    description: 'Show details of a specific IngressAttributes',
    response: z.object({ data: ingressAttributesObject }),
  },
]);
