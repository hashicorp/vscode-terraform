import * as path from 'path';
import { runTests } from 'vscode-test';

async function main() {
  try {
    const extensionDevelopmentPath = path.resolve(__dirname, '../../');

    const extensionTestsPath = path.resolve(__dirname, './test-main');

    const testWorkspacePath = path.resolve(__dirname, "../../templates");

    const options = {
      extensionDevelopmentPath,
      extensionTestsPath,
      launchArgs: [
        testWorkspacePath
      ]
    };

    console.log("Running tests with the following options", options);

    // Download VS Code, unzip it and run the integration test
    await runTests(options);
  } catch (err) {
    console.error('Failed to run tests');
    process.exit(1);
  }
}

main();