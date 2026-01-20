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

function findWindowsInsidersExe(basePath) {
  if (!fs.existsSync(basePath)) return undefined;

  const entries = fs.readdirSync(basePath, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(basePath, entry.name);
    if (entry.isDirectory()) {
      const found = findWindowsInsidersExe(fullPath);
      if (found) return found;
    } else if (entry.name === 'Code - Insiders.exe') {
      return fullPath;
    }
  }
  return undefined;
}

const testSuiteFolderNames = fs
  .readdirSync(BASE_SRC_PATH, { withFileTypes: true })
  .filter((entry) => entry.isDirectory()) // only directories ...
  .filter((entry) => fs.existsSync(path.join(BASE_SRC_PATH, entry.name, 'workspace'))) // ... that contain a workspace folder are valid
  .map((entry) => entry.name);

const configs = testSuiteFolderNames.map((folderName) => {
  const isInsiders = process.env['VSCODE_VERSION'] === 'insiders';
  const isWindows = process.platform === 'win32';

  let vscodeExecutablePath;

  // Logic specifically for Windows Insiders path bug
  if (isInsiders && isWindows) {
    const insidersRoot = path.resolve('.vscode-test/vscode-win32-x64-archive-insiders');
    vscodeExecutablePath = findWindowsInsidersExe(insidersRoot);

    if (vscodeExecutablePath) {
      console.log(`[Custom Path] Found Insiders Executable at: ${vscodeExecutablePath}`);
    }
  }

  return {
    label: `Integration Tests - ${folderName}`,
    version: process.env['VSCODE_VERSION'] ?? 'stable',
    // Provide path ONLY if we found it for Windows Insiders
    vscodeExecutablePath,
    workspaceFolder: process.env['VSCODE_WORKSPACE_FOLDER'] ?? path.join(BASE_SRC_PATH, folderName, 'workspace'),
    launchArgs: ['--disable-extensions', '--disable-workspace-trust'],
    files: `${BASE_OUT_PATH}/${folderName}/*.test.js`,
    mocha: {
      ui: 'tdd',
      color: true,
      timeout: 100000,
      require: ['./out/test/mockSetup.js'],
    },
  };
});

const config = defineConfig({
  tests: configs,
  coverage: {
    exclude: ['src/test/**', '**/node_modules/**', '**/dist/**'],
  },
});

export default config;
