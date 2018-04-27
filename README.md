<!-- markdownlint-disable -->
<h1 align="center">
  <br>
    <img src="https://raw.githubusercontent.com/mauve/vscode-terraform/master/terraform.png" alt="logo" width="200">
  <br>
  vscode-terraform
  <br>
  <br>
</h1>

<h4 align="center">Adds syntax highlightning and other editing features for <a href="https://www.terraform.io/">Terraform</a> files</h4>

<p align="center">
  <a href="https://travis-ci.org/mauve/vscode-terraform">
    <img src="https://travis-ci.org/mauve/vscode-terraform.svg?branch=master">
  </a>
  <a href="https://github.com/mauve/vscode-terraform/releases">
    <img src="https://img.shields.io/github/release/mauve/vscode-terraform.svg" alt="Release">
  </a>
</p>
<!-- markdownlint-enable -->
<!-- markdownlint-disable MD002 MD013 MD041 -->

## Features at a glance

- Auto-completion support
  1. `Terraform` high level types `(variable, resource, data, module ...)` auto completion support.
  2. `resource` types `(aws_dynamodb_table ...)` auto completion support for `aws, azure & google`
  3. `resource | data | module | output | variable` property types auto completion support
  4. `resource | data` 1-level nested block property types auto completion support 
- Syntax highlightning for `.tf` and `.tfvars` files (and `.hcl`)
- Automatic formatting using `terraform fmt`
- Automatically closes braces and quotes
- Adds a command for running `terraform validate`
- Linting support with the help of [tflint](https://github.com/wata727/tflint)
- Browse document symbols
- Browse workspace symbols
- Peek definition
- Goto definition
- Find references
- Completion for variables and outputs
- Rename variables, resource, and data types and all references
- Show variable values on hover

## Syntax Highlighting

![Syntax Highlighting](https://raw.githubusercontent.com/mauve/vscode-terraform/master/images/screenshot.png)

## Auto-completion support

![Auto completion](https://raw.githubusercontent.com/mauve/vscode-terraform/master/images/terraform-auto-completion.gif)

## Formatting support

The plugin also ships a formatter integration which uses `terraform fmt` for
formatting files. Formatting can be disabled by setting `terraform.format.enable`
to `false`.

## Linting

![Linting support](https://raw.githubusercontent.com/mauve/vscode-terraform/master/images/screenshot-tflint.png)

You can lint your terraform templates by invoking the command `Terraform: Lint` from within VSCode.

Linting is supported with the help of [tflint](https://github.com/wata727/tflint), either download it and add it
to your path or can configure `terraform.lintPath` to point to your tflint executable. `tflint` will be executed
with the workspace directory as the current working directory so you can configure `tflint` by dropping a `.tflint.hcl`
file in your workspace root.
You can change the configuration file path by supplying the configuration option `terraform.lintConfig`.

## Validation

You can `terraform validate` your project by invoking the command `Terraform: Validate` from within VSCode.

`terraform validate` is invoked with the workspace root as current working directory and with the setting
`terraform.templateDirectory` as template directory, by default this setting is "templates" (relative to
workspace root).

Because the output of `terraform validate` is not parseable the output is just dumped into the output tab.

### Experimental Indexing support

Enabling indexing support requires the tool [terraform-index](https://github.com/mauve/terraform-index) to be
available and the feature to be enabled by setting `terraform.indexing.enabled` to `true` (it defaults to `false`).

Currently only `resource`, `output` and `variable` are supported, and sometimes even limited.

### Browse Document Symbols

Press `Ctrl+Shift+O` or `⇧⌘O` to browse symbols in the current file.

![Browse Document Symbols](https://raw.githubusercontent.com/mauve/vscode-terraform/master/images/terraform-browse-document-symbols.png)

### Browse Workspace Symbols

Press `Ctrl+T` or `⌘T` to quickly jump to any symbol.

![Browse Workspace Symbols](https://raw.githubusercontent.com/mauve/vscode-terraform/master/images/terraform-browse-workspace-symbols.png)

### Peek and Go To definition

Press `Alt+F12` or `⌥F12` to peek definition (currently only some types supported).

![Peek definition](https://raw.githubusercontent.com/mauve/vscode-terraform/master/images/terraform-peek-definition.png)

### Find All References

Press `Shift+F12` or `⇧F12` to find all references (currently only variables).

![Find all references](https://raw.githubusercontent.com/mauve/vscode-terraform/master/images/terraform-find-references.png)

### Code completion

Press `Ctrl+Space` (also triggered automatically after `.` and `"`) for simple code completion (currently only variables and outputs).

![Complete variables and outputs](https://raw.githubusercontent.com/mauve/vscode-terraform/master/images/terraform-complete-variables-and-outputs.png)

![Complete variables](https://raw.githubusercontent.com/mauve/vscode-terraform/master/images/terraform-complete-variables.png)

### Rename variables, resources and its references

Press `F2` to automatically rename a variable and its usages.

![Rename variable (before)](https://raw.githubusercontent.com/mauve/vscode-terraform/master/images/terraform-rename-variable-before.png)
![Rename variable (after)](https://raw.githubusercontent.com/mauve/vscode-terraform/master/images/terraform-rename-variable-after.png)
