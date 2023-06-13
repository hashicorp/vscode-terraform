/**
 * Copyright (c) HashiCorp, Inc.
 * SPDX-License-Identifier: MPL-2.0
 */

import { makeApi } from '@zodios/core';
import { z } from 'zod';
import { paginationMeta, paginationParams } from './pagination';
import { searchQueryParams } from './filter';

const organization = z.object({
  id: z.string(),
  attributes: z.object({
    'external-id': z.string(),
    name: z.string(),
  }),
});

export type Organization = z.infer<typeof organization>;

const organizations = z.object({
  data: z.array(organization),
  meta: z
    .object({
      pagination: paginationMeta.optional(),
    })
    .optional(),
});

const organizationMemberships = z.object({
  data: z.array(
    z.object({
      id: z.string(),
      attributes: z.object({
        status: z.enum(['active', 'invited']),
      }),
      relationships: z.object({
        organization: z.object({
          data: z.object({
            id: z.string(),
          }),
        }),
      }),
    }),
  ),
});

export const organizationEndpoints = makeApi([
  {
    method: 'get',
    path: '/organizations',
    alias: 'listOrganizations',
    description: 'List organizations of the current user',
    response: organizations,
    parameters: [...paginationParams, ...searchQueryParams],
  },
  {
    method: 'get',
    path: '/organization-memberships',
    alias: 'listOrganizationMemberships',
    description: 'List organization memberships of the current user',
    response: organizationMemberships,
  },
]);
