/**
 * Copyright (c) HashiCorp, Inc.
 * SPDX-License-Identifier: MPL-2.0
 */

import { defineConfig } from '@vscode/test-cli';
import { mkdtempSync } from 'fs';
import * as os from 'os';
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

const configs = testSuiteFolderNames.map((folderName) => mkConfig(folderName));

const config = defineConfig(configs);

export default config;

function mkConfig(folderName) {
  const tmpdir = mkdtempSync(`${os.tmpdir()}/vsc-ada-test-`);
  return {
    label: `tf extension testsuite: ${folderName}`,
    version: process.env['VSCODE_VERSION'] ?? 'stable',
    workspaceFolder: process.env['VSCODE_WORKSPACE_FOLDER'] ?? path.join(BASE_SRC_PATH, folderName, 'workspace'),
    launchArgs: [`--user-data-dir=${tmpdir}`, '--profile-temp', '--disable-extensions', '--disable-workspace-trust'],
    files: `${BASE_OUT_PATH}/${folderName}/*.test.js`,
    env: {
      DISPLAY: ':99.0',
    },
    mocha: {
      ui: 'tdd',
      color: true,
      timeout: 100000,
    },
  };
}
