<img alt="Terraform" src="./terraform.png">

## Adds syntax highlighting and other editing features for <a href="https://www.terraform.io/">Terraform</a> files in integration with the [Terraform Language Server](https://github.com/hashicorp/terraform-ls)

<!-- <p align="center">
  <a href="https://mauvezero.visualstudio.com/vscode-terraform/_build?definitionId=5">
    <img src="https://mauvezero.visualstudio.com/vscode-terraform/_apis/build/status/mauve.vscode-terraform?branchName=master">
  </a>
  <a href="https://github.com/mauve/vscode-terraform/releases">
    <img src="https://img.shields.io/github/release/mauve/vscode-terraform.svg" alt="Release">
  </a>
</p> -->
<!-- markdownlint-enable -->
<!-- markdownlint-disable MD002 MD013 MD041 -->

## Features

- Manages installation and updates of the [Terraform Language Server (terraform-ls)](https://github.com/hashicorp/terraform-ls)
- Adds auto-completion via terraform-ls
  1. Terraform provider and resource names
  2. `for_each` and `variable` syntax shortcuts (`fore`, `vare`, `varm`)
- Includes syntax highlighting for `.tf` and `.tfvars` files (and `.hcl`) -- including all syntax changes new to Terraform 0.12
- Closes braces and quotes

## Release History

**v2.0.0**  is the first official release from HashiCorp, prior releases were by [Mikael Olenfalk](https://github.com/mauve).

The 2.0.0 release integrates a new [Language Server package from HashiCorp](https://github.com/hashicorp/terraform-ls). The extension will install and upgrade terraform-ls to continue to add new functionality around code completion and formatting. See the [terraform-ls CHANGELOG](https://github.com/hashicorp/terraform-ls/blob/master/CHANGELOG.md) for details.

In addition, this new version brings the syntax highlighting up to date with all HCL2 features, as needed for Terraform 0.12 and above.

See the [CHANGELOG](https://github.com/hashicorp/terraform-vscode-extension-internal/blob/master/CHANGELOG.md) for more information.

## Terraform 0.11

If you are using a Terraform version prior to 0.12.0, you should pin to versions of this extension prior to v2.0.0.

## Credits

- [Mikael Olenfalk](https://github.com/mauve) - creating and supporting the [vscode-terraform](https://github.com/mauve/vscode-terraform) extension, which was used as a starting point and inspiration for this extension.
