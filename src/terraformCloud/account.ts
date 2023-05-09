/**
 * Copyright (c) HashiCorp, Inc.
 * SPDX-License-Identifier: MPL-2.0
 */

import { makeApi } from '@zodios/core';
import { z } from 'zod';

const accountDetails = z.object({
  data: z.object({
    id: z.string(),
    type: z.string(),
    attributes: z.object({
      username: z.string(),
      email: z.string(),
    }),
  }),
});

export const accountEndpoints = makeApi([
  {
    method: 'get',
    path: '/account/details',
    alias: 'getUser',
    description: 'Get user details',
    response: accountDetails,
  },
]);
