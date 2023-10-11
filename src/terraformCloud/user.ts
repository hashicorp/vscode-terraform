/**
 * Copyright (c) HashiCorp, Inc.
 * SPDX-License-Identifier: MPL-2.0
 */

import { makeApi } from '@zodios/core';
import { z } from 'zod';

const userAttributes = z.object({
  username: z.string(),
  'is-service-account': z.boolean(),
  'avatar-url': z.string(),
});
export type UserAttributes = z.infer<typeof userAttributes>;

export const user = z.object({
  id: z.string(),
  type: z.literal('users'),
  attributes: userAttributes,
});
export type User = z.infer<typeof user>;

export const userEndpoints = makeApi([
  {
    method: 'get',
    path: '/users/:user_id',
    alias: 'getUser',
    description: 'Get user information',
    response: z.object({ data: user }),
  },
]);
