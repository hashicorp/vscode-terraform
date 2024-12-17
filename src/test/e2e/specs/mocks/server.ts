/**
 * Copyright (c) HashiCorp, Inc.
 * SPDX-License-Identifier: MPL-2.0
 */

import * as vscode from 'vscode';
import { ZodiosPathsByMethod, ZodiosResponseByPath } from '@zodios/core/lib/zodios.types';
import { pluginFetch } from '@zodios/plugins';
import { ResponseResolver, http } from 'msw';
import { setupServer, SetupServerApi } from 'msw/node';
import { apiClient, earlyApiClient, pingClient, TerraformCloudAPIUrl } from '../../../../api/terraformCloud';
import { handlers } from './handlers';

type Api = typeof apiClient.api;

export function mockGetApiClient<Path extends ZodiosPathsByMethod<Api, 'get'>>(
  path: Path,
  // eslint-disable-next-line @typescript-eslint/ban-types
  resolver: ResponseResolver<{}, never, Awaited<ZodiosResponseByPath<Api, 'get', Path>>>,
) {
  return http.get(`${TerraformCloudAPIUrl}${path}`, resolver);
}

let server: SetupServerApi;
export let debugChannel: vscode.OutputChannel;

export function setupMockServer() {
  debugChannel = vscode.window.createOutputChannel('MSW Debug Channel');

  earlyApiClient.use(pluginFetch({}));
  pingClient.use(pluginFetch({}));
  apiClient.use(pluginFetch({}));

  server = setupServer(...handlers);

  server.events.on('request:unhandled', ({ request }) => {
    debugChannel.appendLine(
      `Intercepted a request without a matching request handler: ${request.method} ${request.url}`,
    );
  });

  server.events.on('response:mocked', ({ request, response }) => {
    debugChannel.appendLine(
      `Outgoing request "${request.method} ${request.url}" received mock response: ${response.status} ${response.statusText}`,
    );
  });
  server.listen();
}

export function stopMockServer() {
  server.close();
}

export function appendLine(line: string) {
  debugChannel?.appendLine(line);
}
