# Terraform Visual Studio Code Extension

<img alt="HashiCorp Terraform" src="terraform-banner.png" width="600px">

The HashiCorp Terraform Visual Studio Code (VS Code) extension adds syntax highlighting and other editing features for <a href="https://www.terraform.io/">Terraform</a> files using the [Terraform Language Server](https://github.com/hashicorp/terraform-ls).

## Features

- Manages installation and updates of the [Terraform Language Server (terraform-ls)](https://github.com/hashicorp/terraform-ls), exposing its features:
  - Initialized provider completion (resource names, data source names, attribute names)
- Includes syntax highlighting for `.tf` and `.tfvars` files (and `.hcl`) -- including all syntax changes new to Terraform 0.12
- Closes braces and quotes
- Includes `for_each` and `variable` syntax shortcuts (`fore`, `vare`, `varm`)

## Release History

**v2.0.0**  is the first official release from HashiCorp, prior releases were by [Mikael Olenfalk](https://github.com/mauve).

The 2.0.0 release integrates a new [Language Server package from HashiCorp](https://github.com/hashicorp/terraform-ls). The extension will install and upgrade terraform-ls to continue to add new functionality around code completion and formatting. See the [terraform-ls CHANGELOG](https://github.com/hashicorp/terraform-ls/blob/master/CHANGELOG.md) for details.

In addition, this new version brings the syntax highlighting up to date with all HCL2 features, as needed for Terraform 0.12 and above.

See the [CHANGELOG](https://github.com/hashicorp/vscode-terraform/blob/master/CHANGELOG.md) for more information.

## Terraform 0.11

If you are using a Terraform version prior to 0.12.0, you should [pin to earlier versions](https://code.visualstudio.com/updates/v1_30#_install-previous-versions) of this extension prior to v2.0.0.

## Credits

- [Mikael Olenfalk](https://github.com/mauve) - creating and supporting the [vscode-terraform](https://github.com/mauve/vscode-terraform) extension, which was used as a starting point and inspiration for this extension.
