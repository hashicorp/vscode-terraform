# Building

The extension makes use of the [VSCode Language Server](https://github.com/Microsoft/vscode-languageserver-node) client package to integrate with [terraform-ls](https://github.com/hashicorp/terraform-ls) for [language features](https://code.visualstudio.com/api/language-extensions/programmatic-language-features). The directions below cover how to build and package the extension; please see the `terraform-ls` documentation for how to build the language server executable.

Requirements:

- Node
- npm
- VSCode

After cloning the repo, run `npm i` to install dependencies. There's an included build task to compile the TypeScript files to JavaScript; you can run it directly with `npm run compile`.

In order to use an independently built or installed version of `terraform-ls`, you will need to set `terraform.languageServer.pathToBinary` to the correct executable path.

The extension can be run in a development mode (useful for testing syntax highlighting changes, for example) via the debug task called `Launch Client`. This will open a new window with the extension loaded, and from there you can open any files or folders you want to check against. This extension development window can also be used to run commands, and use the language server installer.

To package your local development copy for testing, use the [vsce](https://www.npmjs.com/package/vsce) tool with `vcse package`.

# Development

We are an open source project on GitHub and would enjoy your contributions! Please [open a new issue](https://github.com/hashicorp/terraform-vscode-extension/issues) before working on a PR that requires significant effort. This will allow us to make sure the work is in line with the project's goals.

# Testing

Automated tests can be written using [mocha](https://mochajs.org) and live inside `./src` with file pattern `*.test.ts`. To run the tests from the command-line with `npm t` you will need to have closed any open VSCode windows. The tests can also be run within VSCode itself, using the debug task `Run Extension Tests`. It is required that `terraform` is available on `$PATH` for integration tests of the language server.

## Integration Tests
It is possible to write integration tests with the extension running against the language server. An example can be seen in [`./src/test/symbols.test.ts`](src/test/symbols.test.ts). Unfortunately automated user input does not appear to be possible (keypresses, cursor clicks), but some integration testing can be performed by using the vscode API to open/edit files, and triggering events/commands such as language server requests and verifying the responses.

Any of the [built in commands](https://code.visualstudio.com/api/references/commands) along with any custom commands the extension has defined can be triggered. Where needed, [expose items to the public API](https://github.com/hashicorp/vscode-terraform/blob/70bfcf060e3e2d75cfa67a453cd4c9e1cec9a1d4/src/extension.ts#L87) of the extension for [inspection](https://github.com/hashicorp/vscode-terraform/blob/70bfcf060e3e2d75cfa67a453cd4c9e1cec9a1d4/src/test/helper.ts#L33) during tests. Helpers, such as the `open` helper should be added to [`./src/test/helper.ts`](src/test/helper.ts).

Sample files for tests should be added to the [`./testFixture`](testFixture/) folder, this is the folder vscode will open with during tests, the running of `terraform init` has been automated. Starting from this folder will prevent the language server from walking this projects other folders that typically exist such as `node_modules`, however `process.cwd()` is still be the project root.
