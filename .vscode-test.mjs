/**
 * Copyright (c) HashiCorp, Inc.
 * SPDX-License-Identifier: MPL-2.0
 */

import { defineConfig } from '@vscode/test-cli';
<<<<<<< HEAD
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
=======

const config = defineConfig({
  version: process.env['VSCODE_VERSION'] ?? 'stable',
  workspaceFolder: process.env['VSCODE_WORKSPACE_FOLDER'] ?? './test/fixtures',
  launchArgs: ['--disable-extensions', '--disable-workspace-trust'],
  files: 'out/test/**/*.test.js',
>>>>>>> 62ff678 (feat: add opentofu language server download (#43))
  mocha: {
    ui: 'tdd',
    color: true,
    timeout: 100000,
<<<<<<< HEAD
    require: ['./out/test/mockSetup.js'], // mocks are shared for all test suites
  },
}));

const config = defineConfig(configs);
=======
  },
});
>>>>>>> 62ff678 (feat: add opentofu language server download (#43))

export default config;
