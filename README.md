<img alt="Terraform" src="https://www.terraform.io/assets/images/logo-hashicorp-3f10732f.svg" width="600px">

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

- Manages installation and updates of the Terraform Language Server (terraform-ls)
- Adds auto-completion via terraform-ls
  1. Terraform provider and resource names
  2. For_each and variable syntax shortcuts (`fore`, `vare`, `varm`)
- Includes syntax highlighting for `.tf` and `.tfvars` files (and `.hcl`) -- including all syntax changes new to Terraform 0.12
- Closes braces and quotes

## Release history

### 2.0.0

This 2.0.0 release integrates a new Language Server package from HashiCorp. The extension will install and upgrade terraform-ls to continue to add new functionality around code completion and formatting. See the terraform-ls release notes for details.

In addition, this new version brings the syntax highlighting up to date with all HCL2 features, as needed for Terraform 0.12 and above.

### 1.0.0

- Indexing support is no longer experimental
- Indexing support no longer requires a separate tool (HCL parsing is now built directly into the plugin)
- *Rename refactoring* now supports all types
- Hovering a variable shows the default value
- A code lens shows how often a resource (or variable, or data) is referenced
- Terraform now works with *Visual Studio LiveShare* (thanks to [@lostintangent](https://github.com/lostintangent))

## Credits

- [Mikael Olenfalk](https://github.com/mauve) - creating and supporting the [vscode-terraform](https://github.com/mauve/vscode-terraform) extension, which was used as a starting point and inspiration for this extension.
