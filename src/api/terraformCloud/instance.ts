/**
 * Copyright (c) HashiCorp, Inc.
 * SPDX-License-Identifier: MPL-2.0
 */

import { makeApi } from '@zodios/core';
import { z } from 'zod';
import { errors } from './errors';

const hcpInstance = z.object({
  appName: z.string().nullish(),
  apiVersion: z.string().nullish(),
});
export type HCPInstance = z.infer<typeof hcpInstance>;

const details = z.object({
  data: hcpInstance,
});
export type HCPInstanceDetails = z.infer<typeof details>;

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
