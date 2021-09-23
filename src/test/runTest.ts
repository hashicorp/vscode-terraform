import * as path from 'path';
import { runTests } from 'vscode-test';
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
    // The folder containing the Extension Manifest package.json
    // Passed to `--extensionDevelopmentPath`
    // this is also the process working dir, even if vscode opens another folder
    const extensionDevelopmentPath = path.resolve(__dirname, '../../');

    // The path to the extension test runner script
    // Passed to --extensionTestsPath
    const extensionTestsPath = path.resolve(__dirname, './index');

    // Download VS Code, unzip it and run the integration test
    // start in the fixtures folder to prevent the language server from walking all the
    // project root folders, like node_modules
    await runTests({
      extensionDevelopmentPath,
      extensionTestsPath,
      launchArgs: ['testFixture', '--disable-extensions'],
    }); // use current release

    await runTests({
      extensionDevelopmentPath,
      extensionTestsPath,
      version: 'insiders',
      launchArgs: ['testFixture', '--disable-extensions'],
    });

    await runTests({
      extensionDevelopmentPath,
      extensionTestsPath,
      version: '1.52.0',
      launchArgs: ['testFixture', '--disable-extensions'],
    });
  } catch (err) {
    console.error(err);
    console.error('Failed to run tests');
    process.exitCode = 1;
  }
}

main();
