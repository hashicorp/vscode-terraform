# Integration tests

This directory contains integration tests which test the VS Code extension (and the included language server) in a VS Code instance.

Run these tests via
```sh
$ npm run test
```

## Adding new tests

The way `vscode-test-cli` currently works is that it expects a single workspace to be opened and all tests to run within that workspace. To allow for multiple scenarios, it instead supports specifying an array of separate configs in `.vscode-test.mjs`. To make it easier for us to have multiple test suites with different workspace fixtures without needing to explicitly define all of them in a very similar fashion, our `vscode-test.mjs` builds this configuration dynamically by reading the `src/test/integration` directory.

To add new test cases for existing test suites (aka tests sharing the same fixtures aka the same workspace), you can just add more `*.test.ts` files alongside the existing ones.

To add a new test suite (which brings its own workspace), add a new directory within `src/test/integration` that itself contains a directory named `workspace` which in most cases contains the Terraform config that should be used in tests.

The `mocks` directory contains no `workspace` subdirectory, hence it's not loaded as a test suite. It contains API mocks that are currently shared by all test suites.

## Caveats

### Stale Extension / Tests
The extension and the tests aren't compiled as part of the tests, if invoking them via the VS Code ["Extension Test Runner" Extension](https://marketplace.visualstudio.com/items?itemName=ms-vscode.extension-test-runner). The easiest way to use the extension for running tests from the editor is to keep running `npm run compile:test:watch` in a terminal.

Beware that removing TypeScript files won't remove the transpiled JS files in the `out` directory. If you are experiencing Phantom tests running, run `rm -rf out`.

### Stale VS Code test instance state
During the development of tests, it is possible to bring VS Code into a state where it has multiple windows open and seems to add one new window every time the tests are run. This happened for example, when trying to replace the current workspace folder with another one. If this happens, run `rm -rf .vscode-test` to remove the directory in which the test instance is installed into and which holds its state.

### Language Server isn't re-fetched automatically
The language server used by the extension is automatically downloaded when running `npm install` in `vscode-terraform` if it didn't yet exist in `bin/terraform-ls`. This means that you might be running an outdated language server if you haven't manually removed or replaced that file in a long time. To update the language server, run `rm bin/terraform-ls && npm install`.
