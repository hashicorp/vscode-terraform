/**
 * Copyright (c) HashiCorp, Inc.
 * SPDX-License-Identifier: MPL-2.0
 */

import { ExTester, ReleaseQuality } from 'vscode-extension-tester';

async function runTests() {
  let code_version;
  let code_type;

  if (process.env.VSCODE_VERSION === 'insiders') {
    code_type = ReleaseQuality.Insider;
  } else if (process.env.VSCODE_VERSION === 'stable') {
    code_type = ReleaseQuality.Stable;
  } else {
    code_version = process.env.VSCODE_VERSION;
  }

  if (code_type) {
    console.log(`Running tests for ${code_version} ${code_type} version of VS Code`);
  } else {
    console.log(`Running tests for ${code_version} version of VS Code`);
  }

  process.env.HASHI_CODE_TEST = 'true';

  const tester = new ExTester('.test-storage', code_type, '.test-extensions', false);
  await tester.setupAndRunTests(
    'out/test/e2e/specs/**/*.e2e.js',
    code_version,
    {
      installDependencies: false,
    },
    {
      settings: 'src/test/e2e/settings.json',
      cleanup: true,
      config: 'src/test/e2e/.mocharc.js',
      logLevel: 'info',
      resources: [],
    },
  );
}

runTests().catch(console.error);
