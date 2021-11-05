import * as path from 'path';
import { runTests } from 'vscode-test';
import { TestOptions } from 'vscode-test/out/runTest';
import { exec } from '../utils';

async function terraformInit() {
  const cwd = process.cwd();
  process.chdir('testFixture');
  const { stdout } = await exec('terraform', ['init', '-no-color']);
  console.log(stdout);
  process.chdir(cwd);
}

async function main(): Promise<void> {
  try {
    // initialize terraform before vscode opens
    await terraformInit();
  } catch (err) {
    console.error(err);
    console.error('Failed to run tests');
    process.exitCode = 1;
  }

  // The folder containing the Extension Manifest package.json
  // Passed to `--extensionDevelopmentPath`
  // this is also the process working dir, even if vscode opens another folder
  const extensionDevelopmentPath = path.resolve(__dirname, '../../');

  // The path to the extension test runner script
  // Passed to --extensionTestsPath
  const extensionTestsPath = path.resolve(__dirname, './integration/index');

  // common options for all runners
  const options: TestOptions = {
    extensionDevelopmentPath,
    extensionTestsPath,
    launchArgs: ['testFixture', '--disable-extensions', '--disable-workspace-trust'],
  };

  try {
    // Download VS Code, unzip it and run the integration test
    // start in the fixtures folder to prevent the language server from walking all the
    // project root folders, like node_modules
    console.log('_______________LATEST_____________________');
    await runTests(options);

    console.log('_______________INSIDERS___________________');
    options.version = 'insiders';
    await runTests(options);

    console.log('________________1.55.0____________________');
    options.version = '1.55.0';
    await runTests(options);
  } catch (err) {
    console.error(err);
    console.error('Failed to run tests');
    process.exitCode = 1;
  }
}

main();
