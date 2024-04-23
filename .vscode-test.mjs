/**
 * Copyright (c) HashiCorp, Inc.
 * SPDX-License-Identifier: MPL-2.0
 */

import { defineConfig } from '@vscode/test-cli';

const workspaceFolder = "./src/test/integration/basics/workspace"

const config = defineConfig({
  version: process.env['VSCODE_VERSION'] ?? 'stable',
  workspaceFolder: process.env['VSCODE_WORKSPACE_FOLDER'] ?? workspaceFolder,
  launchArgs: ['--disable-extensions', '--disable-workspace-trust'],
  files: 'out/test/integration/basics/*.test.js',
  mocha: {
    ui: 'tdd',
    color: true,
    timeout: 100000,
    require: ['./out/test/mockSetup.js'],
  },
});

export default config;
