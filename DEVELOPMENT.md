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

Automated tests can be written using [mocha](https://mochajs.org) and live inside `/src/test`. To run the tests from the command-line with `npm t` you will need to have closed any open VSCode windows. The tests can also be run within VSCode itself, using the debug task `Run Extension Tests`.
