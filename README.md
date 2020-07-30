# Terraform Visual Studio Code Extension

<img alt="HashiCorp Terraform" src="terraform-banner.png" width="600px">

The HashiCorp Terraform Visual Studio Code (VS Code) extension adds syntax highlighting and other editing features for <a href="https://www.terraform.io/">Terraform</a> files using the [Terraform Language Server](https://github.com/hashicorp/terraform-ls).

## Features

- Manages installation and updates of the [Terraform Language Server (terraform-ls)](https://github.com/hashicorp/terraform-ls), exposing its features:
  - Initialized provider completion (resource names, data source names, attribute names)
- Includes syntax highlighting for `.tf` and `.tfvars` files -- including all syntax changes new to Terraform 0.12
- Closes braces and quotes
- Includes `for_each` and `variable` syntax shortcuts (`fore`, `vare`, `varm`)

## Configuration

If you have multiple root modules in your workspace, you can configure the language server settings to identify them. Edit this through the VSCode Settings UI or add a `.vscode/settings.json` file using the following template:
```
{
    "terraform-ls.rootModules": [
        "/module1",
        "/module2"
    ]
}
```

If you want to automatically search root modules in your workspace and exclude some folders,  you can configure the language server settings to identify them.
```
{
    "terraform-ls.rootModules-exclude": [
        "/module3",
        "/module4"
    ]
}
```

## Release History

**v2.0.0**  is the first official release from HashiCorp, prior releases were by [Mikael Olenfalk](https://github.com/mauve).

The 2.0.0 release integrates a new [Language Server package from HashiCorp](https://github.com/hashicorp/terraform-ls). The extension will install and upgrade terraform-ls to continue to add new functionality around code completion and formatting. See the [terraform-ls CHANGELOG](https://github.com/hashicorp/terraform-ls/blob/master/CHANGELOG.md) for details.

In addition, this new version brings the syntax highlighting up to date with all HCL2 features, as needed for Terraform 0.12 and above.

**Configuration Changes** Please note that in 2.x, the configuration differs from 1.4.0, if you are having issues with the Language Server starting, you can reset the configuration to the following:

```json
{
  "terraform.languageServer": {
    "external": true,
    "args": [
      "serve"
    ]
  }
}
```

See the [CHANGELOG](https://github.com/hashicorp/vscode-terraform/blob/master/CHANGELOG.md) for more information.

## Terraform 0.11

If you are using a Terraform version prior to 0.12.0, you can install the pre-transfer version of this extension manually by [following the instructions in the wiki](https://github.com/hashicorp/vscode-terraform/wiki/Install-a-Pre-transfer-Version).

## Known Issues

* Multi-folder workspaces are not yet supported. ([info](https://github.com/hashicorp/vscode-terraform/issues/329#issuecomment-639378948))
* A number of different folder configurations (specifically when your root module is not a parent to any submodules) are not yet supported. ([info](https://github.com/hashicorp/terraform-ls/issues/32#issuecomment-649707345))

## Credits

- [Mikael Olenfalk](https://github.com/mauve) - creating and supporting the [vscode-terraform](https://github.com/mauve/vscode-terraform) extension, which was used as a starting point and inspiration for this extension.
