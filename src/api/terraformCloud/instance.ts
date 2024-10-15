/**
 * Copyright (c) HashiCorp, Inc.
 * SPDX-License-Identifier: MPL-2.0
 */

import { makeApi } from '@zodios/core';
import { z } from 'zod';
import { errors } from './errors';

export const pingEndpoints = makeApi([
  {
    method: 'get',
    path: '/ping',
    alias: 'ping',
    description: 'Get instance details',
    response: z.object({
      appName: z.string().nullish(),
      apiVersion: z.string().nullish(),
    }),
    errors,
  },
]);
