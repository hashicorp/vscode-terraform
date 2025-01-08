/**
 * Copyright (c) The OpenTofu Authors
 * SPDX-License-Identifier: MPL-2.0
 * Copyright (c) HashiCorp, Inc.
 * SPDX-License-Identifier: MPL-2.0
 */



import { defineConfig } from '@vscode/test-cli';
import fs from 'fs';
import path from 'path';

// Discover test suite folders in src/test/integration
const BASE_SRC_PATH = './src/test/integration';
const BASE_OUT_PATH = './out/test/integration';

const testSuiteFolderNames = fs.readdirSync(BASE_SRC_PATH, { withFileTypes: true })
  .filter(entry => entry.isDirectory()) // only directories ...
  .filter(entry => fs.existsSync(path.join(BASE_SRC_PATH, entry.name, "workspace"))) // ... that contain a workspace folder are valid
  .map(entry => entry.name);

const configs = testSuiteFolderNames.map(folderName => ({
  version: process.env['VSCODE_VERSION'] ?? 'stable',
  workspaceFolder: process.env['VSCODE_WORKSPACE_FOLDER'] ?? path.join(BASE_SRC_PATH, folderName, "workspace"),
  launchArgs: ['--disable-extensions', '--disable-workspace-trust'],
  files: `${BASE_OUT_PATH}/${folderName}/*.test.js`,
  mocha: {
    ui: 'tdd',
    color: true,
    timeout: 100000,
//    require: ['./out/test/mockSetup.js'], // mocks are shared for all test suites, but not needed for opentofu
  },
}));

const config = defineConfig(configs);

export default config;
