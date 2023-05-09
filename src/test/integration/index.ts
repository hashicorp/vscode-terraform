/**
 * Copyright (c) HashiCorp, Inc.
 * SPDX-License-Identifier: MPL-2.0
 */

import * as path from 'path';
import * as Mocha from 'mocha';
import { glob } from 'glob';
import { server } from './mocks/server';
import { apiClient, tokenPluginId } from '../../terraformCloud';

export async function run(): Promise<void> {
  // Create the mocha test
  const mocha = new Mocha({
    ui: 'tdd',
    color: true,
  });
  // integration tests require long activation time
  mocha.timeout(100000);
  // Establish API mocking before all tests.
  mocha.globalSetup(() => {
    apiClient.eject(tokenPluginId);

    server.listen();
  });
  // Clean up after the tests are finished.
  mocha.globalTeardown(() => server.close());

  // const testsRoot = path.resolve(__dirname, '..');
  const testsRoot = path.resolve(__dirname);
  const testFiles = await glob('**/**.test.js', { cwd: testsRoot });

  return new Promise((resolve, reject) => {
    testFiles.forEach((f) => mocha.addFile(path.resolve(testsRoot, f)));

    try {
      // Run the mocha test
      mocha.run((failures) => {
        if (failures > 0) {
          reject(new Error(`${failures} tests failed.`));
        } else {
          resolve();
        }
      });
    } catch (err) {
      console.error(err);
      reject(err);
    }
  });
}
