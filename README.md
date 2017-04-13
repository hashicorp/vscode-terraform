# vscode-terraform

Adds syntax highlightning and other editing features for [Terraform](https://www.terraform.io/) files.

## Features at a glance

- Syntax highlightning for `.tf` and `.tfvars` files (and `.hcl`)
- Automatic format on save using `terraform fmt`
- Automatically closes braces and quotes
- Adds a command for running `terraform validate`
- Linting support with the help of [tflint](https://github.com/wata727/tflint)

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