/**
 * Copyright (c) HashiCorp, Inc.
 * SPDX-License-Identifier: MPL-2.0
 */

import { defineConfig } from '@vscode/test-cli';
import fs from 'fs';
import path from 'path';

// Discover test suite folders in src/test/integration
const BASE_SRC_PATH = './src/test/integration';
const BASE_OUT_PATH = './out/test/integration';

const testSuiteFolderNames = fs
  .readdirSync(BASE_SRC_PATH, { withFileTypes: true })
  .filter((entry) => entry.isDirectory()) // only directories ...
  .filter((entry) => fs.existsSync(path.join(BASE_SRC_PATH, entry.name, 'workspace'))) // ... that contain a workspace folder are valid
  .map((entry) => entry.name);

const configs = testSuiteFolderNames.map((folderName) => ({
  label: `Integration Tests - ${folderName}`,
  version: process.env['VSCODE_VERSION'] ?? 'stable',
  workspaceFolder: process.env['VSCODE_WORKSPACE_FOLDER'] ?? path.join(BASE_SRC_PATH, folderName, 'workspace'),
  launchArgs: [
    path.join(BASE_SRC_PATH, folderName, 'workspace'),
    '--profile-temp',
    '--sync=off',
    '--disable-extensions',
    '--disable-updates',
    '--disable-crash-reporter',
    '--disable-workspace-trust',
    '--disable-telemetry',
  ],
  files: `${BASE_OUT_PATH}/${folderName}/*.test.js`,
  mocha: {
    ui: 'tdd',
    color: true,
    timeout: 100000,
    require: ['./out/test/mockSetup.js'], // mocks are shared for all test suites
  },
}));

// const config = defineConfig(configs);
const config = defineConfig({
  tests: configs,
  coverage: {
    includeAll: true,
    exclude: ['**/src/test', '**/dist', '**/*.test.[tj]s', '**/*.ts'],
    reporter: ['text-summary', 'html', 'json-summary'],
  },
});

export default config;
