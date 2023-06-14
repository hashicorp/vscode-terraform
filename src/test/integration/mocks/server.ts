/**
 * Copyright (c) HashiCorp, Inc.
 * SPDX-License-Identifier: MPL-2.0
 */

import { ZodiosPathsByMethod, ZodiosResponseByPath } from '@zodios/core/lib/zodios.types';
import { ResponseResolver, rest, RestContext, RestRequest } from 'msw';
import { setupServer } from 'msw/node';
import { TerraformCloudAPIUrl, apiClient } from '../../../terraformCloud';

type Api = typeof apiClient.api;

export function mockGet<Path extends ZodiosPathsByMethod<Api, 'get'>>(
  path: Path,
  resolver: ResponseResolver<RestRequest, RestContext, Awaited<ZodiosResponseByPath<Api, 'get', Path>>>,
) {
  return rest.get(`${TerraformCloudAPIUrl}${path}`, resolver);
}

const handlers = [
  mockGet('/account/details', (_, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        data: {
          id: 'user-1',
          type: 'user',
          attributes: {
            username: 'user',
            email: 'user@example.com',
          },
        },
      }),
    );
  }),
];

// This configures a request mocking server with the given request handlers.
export const server = setupServer(...handlers);
