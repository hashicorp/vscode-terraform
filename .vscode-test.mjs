/**
 * Copyright (c) HashiCorp, Inc.
 * SPDX-License-Identifier: MPL-2.0
 */

import { defineConfig } from '@vscode/test-cli';
// import { apiClient, tokenPluginId } from './src/terraformCloud';
// import { server } from './src/test/integration/mocks/server';

const config = defineConfig({
  version: process.env['VSCODE_VERSION'] ?? 'stable',
  workspaceFolder: process.env['VSCODE_WORKSPACE_FOLDER'] ?? './testFixture',
  launchArgs: ['--disable-extensions', '--disable-workspace-trust'],
  files: 'out/test/**/*.test.js',
  mocha: {
    ui: 'tdd',
    color: true,
    timeout: 100000,
  },
});

// how to do this?
// config.mocha.globalSetup = () => {
//   apiClient.eject(tokenPluginId);

//   server.listen();
// };
// config.mocha.globalTeardown = () => server.close();

export default config;
