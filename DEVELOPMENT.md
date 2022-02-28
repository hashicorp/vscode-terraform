# Development

We are an open source project on GitHub and would enjoy your contributions! Please [open a new issue](https://github.com/hashicorp/terraform-vscode/issues) before working on a PR that requires significant effort. This will allow us to make sure the work is in line with the project's goals.

## Building

The extension makes use of the [VSCode Language Server](https://github.com/Microsoft/vscode-languageserver-node) client package to integrate with [terraform-ls](https://github.com/hashicorp/terraform-ls) for [language features](https://code.visualstudio.com/api/language-extensions/programmatic-language-features). The directions below cover how to build and package the extension; please see the [`terraform-ls`](https://github.com/hashicorp/terraform-ls) documentation for how to build the language server executable.

### Requirements

- VSCode >= 1.61
- Node >= 16.13.2
- npm >= 8.x

### Getting the code

```
git clone https://github.com/hashicorp/vscode-terraform
```

### Dependencies

After cloning the repo, run `npm install` to install dependencies. There's an included build task to compile the TypeScript files to JavaScript; you can run it directly with `npm run compile`.

```
> npm install
> npm run compile
```

> In order to use an independently built or installed version of terraform-ls, you will need to set `terraform.languageServer.pathToBinary` to the correct executable path.

## Running the Extension

The extension can be run in a development mode via the launch task called `Launch Client`. This will open a new VS Code window with the extension loaded, and from there you can open any files or folders you want to check against. This extension development window can also be used to run commands or any other feature the extension provides.

> New to VS Code development? You can get started [here](https://code.visualstudio.com/api/get-started/your-first-extension)

## Tests

Automated `unit` and `integration` tests can be written using [mocha](https://mochajs.org) and live inside `./src/test` with file pattern `*.test.ts`.

> It is *required* that `terraform` is available on `$PATH` to run the tests.

To run the `unit tests` from the command-line run:

```bash
> `npm test:unit`
```

To run the `integration tests` from the command-line without any configuration, run `npm test`. By default, `npm test` will test against VS Code Stable. If you want to test against a different VS Code version, or if you want to have VS Code remain open, use an environment variable to indicate which version of VS Code to test against:

```bash
# VS Code Stable is open, use Insiders:
> VSCODE_VERSION='insiders' npm test

# VS Code Insiders is open, use Stable:
> VSCODE_VERSION='stable' npm test

# Test against VS Code v1.55.8:
> VSCODE_VERSION='1.55.8' npm test
```

To run the `integration` tests in PowerShell, set the environment variable accordingly:

```powershell
# VS Code Stable is open, use Insiders:
> $env:VSCODE_VERSION ='insiders'
> npm test
```

The tests can also be run within VSCode itself, using the launch task `Run Extension Tests`. This will open a new VS Code window, run the test suite, and exit with the test results.

### Acceptance Tests

End to end acceptance tests with the extension running against the language server are a work in progress. An example can be seen in [`./src/test/integration/symbols.test.ts`](src/test/integration/symbols.test.ts).

Unfortunately automated user input does not appear to be possible (keypresses, cursor clicks) at the moment, but some integration testing can be performed by using the vscode API to open/edit files, and triggering events/commands such as language server requests and verifying the responses.

The `terraform init` command runs automatically when tests are executed.

### Test Fixture Data

Sample files for tests should be added to the [`./testFixture`](testFixture/) folder, this is the folder vscode will open during tests. Starting from this folder will prevent the language server from walking other folders that typically exist such as `node_modules`.

## Syntax Grammar Tests

Automated TextMate grammar tests can be written using [vscode-tmgrammar-test](https://github.com/PanAeon/vscode-tmgrammar-test) and live inside `./tests`.

To start the test suite from the command-line run:

```bash
npm test:syntax
```

## Writing TextMate Grammar

The following workflow is recommended to work on Terraform TextMate grammar:

1. Add or modify grammar in the `terraform.tmGrammar.json` file inside the `syntaxes` directory.
1. Add a new unit test file or modify existing unit test files inside the test/unit/terraform directory.
1. Run `npm run test:grammar` until the tests pass
1. Add a new example Terraform file or modify existing unit test files inside the test/snapshot/terraform directory.
1. Run `npm run test:snap` until the tests pass. 

> Tip: Running `npm run test:snap -- -u` after modifying the tmGrammar file will give you a quick visual representation of how the tokens are being resolved. This can aid in crafting unit tests.

## Writing Grammar Unit Tests

Unit tests are Terraform files with `vscode-tmgrammar-test` token lines specifying which TextMate grammar should be resolved.

For example:

> Note: This is shortened to demonstrate, actual syntax will vary

```
resource "example" "thing" {
;         ^^^^^^^ source.terraform string.quoted.double.terraform
;                   ^^^^^ source.terraform string.quoted.double.terraform
;                          ^ source.terraform punctuation.section.block.begin.terraform
}
; <- source.terraform punctuation.section.block.end.terraform

```

## Writing Grammar Snapshot Tests

Snapshot tests comprise of two files: example files and their companion `snap` file.

Snapshot test example files are Terraform files without any `vscode-tmgrammar-test` token lines. Each example file is exactly how you would see it used in production. This ensures scope, inheritance, and resolution of tokens happen exactly as they would on a user's machine.

The companion `snap` file is named the same as the example file with the `.snap` extension, and is the tmGrammar representation of all resolved tokens. This file is committed alongside the example file. If anything changes with regards to how the tokens are resolved, the snapshot test will fail.

> Note: If modifying an existing snapshot test, run `npm run test:snap -- -u` to update the snapshot file. This will update the snapshot file with the new modified grammar. Be sure to do this after you've tested using `npm run test:grammar` and are sure that the modified grammar is correct, otherwise you may get false positives.

## Packaging

To package the extension into a [`platform specific extension`](https://code.visualstudio.com/api/working-with-extensions/publishing-extension#platformspecific-extensions) VSIX ready for testing run the following command:

```
npm run package -- --target=win32-x64
```

Replace `target` with the platform/architecture combination that is on the supported matrix list.

platform | terraform-ls  | extension     | vs code
   --    |           --  |         --    | --
macOS    | darwin_amd64  | darwin_x64    | ✅
macOS    | darwin_arm64  | darwin_arm64  | ✅
Linux    | linux_amd64   | linux_x64     | ✅
Linux    | linux_arm     | linux_armhf   | ✅
Linux    | linux_arm64   | linux_arm64   | ✅
Windows  | windows_386   | win32_ia32    | ✅
Windows  | windows_amd64 | win32_x64     | ✅
Windows  | windows_arm64 | win32_arm64   | ✅

This will run several chained commands which will download the specified version of terraform-ls, minify the extension using esbuild, and package the extension using vsce into a VSIX.

> You can run `npm run package` without paramaters, but this will not produce a platform specific extension.
