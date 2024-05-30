/**
 * Copyright (c) HashiCorp, Inc.
 * SPDX-License-Identifier: MPL-2.0
 */

import { apiClient, tokenPluginId } from '../api/terraformCloud';
import { server } from './integration/mocks/server';

export async function mochaGlobalSetup() {
  apiClient.eject(tokenPluginId);

  server.listen();
}

export async function mochaGlobalTeardown() {
  server.close();
}
