# Terraform Visual Studio Code Extension

<img alt="HashiCorp Terraform" src="terraform-banner.png" width="600px">

The HashiCorp Terraform Visual Studio Code (VS Code) extension adds syntax highlighting and other editing features for <a href="https://www.terraform.io/">Terraform</a> files using the [Terraform Language Server](https://github.com/hashicorp/terraform-ls).

## Features

- Manages installation and updates of the [Terraform Language Server (terraform-ls)](https://github.com/hashicorp/terraform-ls), exposing its features:
  - Completion of initialized providers: resource names, data source names, attribute names
  - Diagnostics to indicate HCL errors as you type
  - Initialize the configuration using "Terraform: init" from the command palette
  - Run `terraform plan` and `terraform apply` from the command palette
  - Validation diagnostics using "Terraform: validate" from the command palette or a `validateOnSave` setting
- Includes syntax highlighting for `.tf` and `.tfvars` files -- including all syntax changes new to Terraform 0.12
- Closes braces and quotes
- Includes `for_each` and `variable` syntax shortcuts (`fore`, `vare`, `varm`)

## Getting Started

**IMPORTANT:** After installing, you must perform a `terraform init` to provide `terraform-ls` with an up-to-date provider schemas. The language server will not work correctly without first completing this step!

1. Install the extension [from the Marketplace](https://marketplace.visualstudio.com/items?itemName=HashiCorp.terraform)
1. Reload VS Code after the installation (click the reload button next to the extension)
1. Perform a `terraform init` to provide `terraform-ls` with an up-to-date provider schema
1. Open your desired workspace and/or the root folder containing your Terraform files. Note: see [Known Issues](#known-issues) below about multi-folder workspaces
1. Depending on your settings in VS Code, completion will start automatically (if not inside quotes/string literal, on certain trigger characters), or you can explicitly trigger completion via keyboard combination (Ctrl+Space on Windows, control+space on Mac).


## Configuration

This extension offers several configuration options. To modify these, navigate to the extension view within VS Code, select the settings cog and choose Extension settings, or alternatively, modify the `.vscode/settings.json` file in the root of your working directory. 

## Telemetry

We use telemetry to send error reports to our team, so we can respond more effectively. If you want to [disable this setting](https://code.visualstudio.com/docs/getstarted/telemetry#_disable-telemetry-reporting), add `"telemetry.enableTelemetry": false` to your settings.json and that will turn off all telemetry in VSCode. You can also [monitor what's being sent](https://code.visualstudio.com/docs/getstarted/telemetry#_output-channel-for-telemetry-events) in your logs.

### Multiple Workspaces
If you have multiple root modules in your workspace, you can configure the language server settings to identify them. Edit this through the VSCode Settings UI or add a `.vscode/settings.json` file using the following template:
```
{
    "terraform-ls.rootModules": [
        "/module1",
        "/module2"
    ]
}
```

If you want to automatically search root modules in your workspace and exclude some folders, you can configure the language server settings to identify them.
```
{
    "terraform-ls.excludeRootModules": [
        "/module3",
        "/module4"
    ]
}
```

### Formatting
To enable formatting, it is recommended that the following be added to the extension settings for the Terraform extension:
```
    "[terraform]": {
        "editor.formatOnSave": true
    }
```

It is also recommended to set a default formatter if you have other extensions installed which also claim a capability to format Terraform files:

```
    "[terraform]": {
        "editor.defaultFormatter": "hashicorp.terraform",
        "editor.formatOnSave": true
    }
```

### Validation
An experimental validate-on-save option can be enabled with the following setting:
```
    "terraform-ls.experimentalFeatures": {
      "validateOnSave": true
    }
```
This will create diagnostics for any elements that fail validation. `terraform validate` can also be run using the setting in the command palette.

## Release History

**v2.0.0**  is the first official release from HashiCorp, prior releases were by [Mikael Olenfalk](https://github.com/mauve).

The 2.0.0 release integrates a new [Language Server package from HashiCorp](https://github.com/hashicorp/terraform-ls). The extension will install and upgrade terraform-ls to continue to add new functionality around code completion and formatting. See the [terraform-ls CHANGELOG](https://github.com/hashicorp/terraform-ls/blob/main/CHANGELOG.md) for details.

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

See the [CHANGELOG](https://github.com/hashicorp/vscode-terraform/blob/main/CHANGELOG.md) for more information.

## Terraform 0.11

If you are using a Terraform version prior to 0.12.0, you can install the pre-transfer version of this extension manually by [following the instructions in the wiki](https://github.com/hashicorp/vscode-terraform/wiki/Install-a-Pre-transfer-Version).

## Known Issues

* Completion inside incomplete blocks, such as `resource "here` (without the closing quote and braces) is not supported. You can complete the 1st level blocks though and that will automatically trigger subsequent completion for e.g. resource types. See [relevant issue](https://github.com/hashicorp/terraform-ls/issues/57) for more.
* A number of different folder configurations (specifically when your root module is not a parent to any submodules) are not yet supported. ([info](https://github.com/hashicorp/terraform-ls/issues/32#issuecomment-649707345))

## User Group
We're starting a user group for the Terraform VS Code extension. This group offers opportunities to provide feedback, access pre-release versions, and help influence the direction of this project. Collaboration and updates will be via HashiCorp Discuss (discuss.hashicorp.com), along with occasional live events.

If you are interested, please complete and submit our [participation form](https://forms.gle/JY2Rwt3e657gRFHj9), and we will get back to you with an invite!

## Credits

- [Mikael Olenfalk](https://github.com/mauve) - creating and supporting the [vscode-terraform](https://github.com/mauve/vscode-terraform) extension, which was used as a starting point and inspiration for this extension.
