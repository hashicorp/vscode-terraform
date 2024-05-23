/**
 * Copyright (c) HashiCorp, Inc.
 * SPDX-License-Identifier: MPL-2.0
 */

import { ZodiosPathsByMethod, ZodiosResponseByPath } from '@zodios/core/lib/zodios.types';
import { ResponseResolver, http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { TerraformCloudAPIUrl, apiClient } from '../../../api/terraformCloud';

type Api = typeof apiClient.api;

export function mockGet<Path extends ZodiosPathsByMethod<Api, 'get'>>(
  path: Path,
  // eslint-disable-next-line @typescript-eslint/ban-types
  resolver: ResponseResolver<{}, never, Awaited<ZodiosResponseByPath<Api, 'get', Path>>>,
) {
  return http.get(`${TerraformCloudAPIUrl}${path}`, resolver);
}

const handlers = [
  mockGet('/account/details', () => {
    return HttpResponse.json({
      data: {
        id: 'user-1',
        type: 'user',
        attributes: {
          username: 'user',
          email: 'user@example.com',
        },
      },
    });
  }),
];

// This configures a request mocking server with the given request handlers.
export const server = setupServer(...handlers);
