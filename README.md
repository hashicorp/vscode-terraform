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

## Features at a glance

- Syntax highlightning for `.tf` and `.tfvars` files (and `.hcl`)
- Automatic format on save using `terraform fmt`
- Automatically closes braces and quotes
- Adds a command for running `terraform validate`
- Linting support with the help of [tflint](https://github.com/wata727/tflint)
- ***EXPERIMENTAL***:
  - Browse document symbols
  - Browse workspace symbols
  - Peek definition
  - Goto definition
  - Find references
  - Completion for variables and outputs
  - Rename variables (and all usages)

## Syntax Highlighting

![Syntax Highlighting](https://raw.githubusercontent.com/mauve/vscode-terraform/master/images/screenshot.png)

## Format on Save

Optionally you can configure that `terraform fmt` is invoked on save to format your terraform files.
Formatting is done only on files with the extension `.tf` or `.tfvars`, so that you can assign this plugin to
any HCL file type you are using which is not necessary terraform.

Format on save is configured using `terraform.formatOnSave` which defaults to `false`. `.tfvars` files can also
be formatted on save by using the setting `terraform.formatVarsOnSave`, by default this setting is `null`
which means that `.tfvars` files are also configured using the `terraform.formatOnSave` setting. You can
use separate settings for `.tfvars` and `.tf` files by setting `terraform.formatVarsOnSave` to anything
other than `null`.

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

### Rename variable and 

Press `F2` to automatically rename a variable and its usages.

![Rename variable (before)](https://raw.githubusercontent.com/mauve/vscode-terraform/master/images/terraform-rename-variable-before.png)
![Rename variable (after)](https://raw.githubusercontent.com/mauve/vscode-terraform/master/images/terraform-rename-variable-after.png)
