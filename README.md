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

### Formatting

To enable formatting, it is recommended that the following be added to the extension settings for the Terraform extension:

```json
"[terraform]": {
  "editor.defaultFormatter": "hashicorp.terraform",
  "editor.formatOnSave": true,
  "editor.formatOnSaveMode": "file"
}
"[terraform-vars]": {
  "editor.defaultFormatter": "hashicorp.terraform",
  "editor.formatOnSave": true,
  "editor.formatOnSaveMode": "file"
}
```

It is recommended to set `editor.defaultFormatter` to ensure that VS Code knows which extension to use to format your files. It is possible to have more than one extension installed which claim a capability to format Terraform files.

When using the `editor.formatOnSaveMode` setting, only `file` is currently supported. The `modifications` or `modificationsIfAvailable` settings [use the currently configured SCM](https://code.visualstudio.com/updates/v1_49#_only-format-modified-text) to detect file line ranges that have changed and send those ranges to the formatter. The `file` setting works because `terraform fmt` was originally designed for formatting an entire file, not ranges. If you don't have an SCM enabled for the files you are editing, `modifications` won't work at all. The `modificationsIfAvailable` setting will fall back to `file` if there is no SCM and will appear to work sometimes.

If you want to use `editor.codeActionsOnSave` with `editor.formatOnSave` to automatically format Terraform files, use the following configuration:

```json
"editor.formatOnSave": true,
"[terraform]": {
  "editor.defaultFormatter": "hashicorp.terraform",
  "editor.formatOnSave": false,
  "editor.codeActionsOnSave": {
    "source.formatAll.terraform": true
  },
},
"[terraform-vars]": {
  "editor.defaultFormatter": "hashicorp.terraform",
  "editor.formatOnSave": false,
  "editor.codeActionsOnSave": {
    "source.formatAll.terraform": true
  },
}
```

This will keep the global `editor.formatOnSave` for other languages you use, and configure the Terraform extension to only format during a `codeAction` sweep.

> **Note**: Ensure that the terraform binary is present in the environment `PATH` variable. If the terraform binary cannot be found, formatting will silently fail.

### Validation

An experimental validate-on-save option can be enabled with the following setting:

```json
"terraform-ls.experimentalFeatures": {
  "validateOnSave": true
}
```

This will create diagnostics for any elements that fail validation. `terraform validate` can also be run using the setting in the command palette.

### Multiple Workspaces

If you have multiple root modules in your workspace, you can configure the language server settings to identify them. Edit this through the VSCode Settings UI or add a `.vscode/settings.json` file using the following template:

```json
"terraform-ls.rootModules": [
  "/module1",
  "/module2"
]
```

If you want to automatically search root modules in your workspace and exclude some folders, you can configure the language server settings to identify them.

```json
"terraform-ls.excludeRootModules": [
  "/module3",
  "/module4"
]
```

### Telemetry

We use telemetry to send error reports to our team, so we can respond more effectively. You can configure VS Code to send all telemetry, just crash telemetry, just errors or turn it off entirely by [configuring](https://code.visualstudio.com/docs/getstarted/telemetry#_disable-telemetry-reporting) `"telemetry.telemetryLevel"` to your desired value. You can also [monitor what's being sent](https://code.visualstudio.com/docs/getstarted/telemetry#_output-channel-for-telemetry-events) in your logs.

## Release History

**v2.0.0** is the first official release from HashiCorp, prior releases were by [Mikael Olenfalk](https://github.com/mauve).

The 2.0.0 release integrates a new [Language Server package from HashiCorp](https://github.com/hashicorp/terraform-ls). The extension will install and upgrade terraform-ls to continue to add new functionality around code completion and formatting. See the [terraform-ls CHANGELOG](https://github.com/hashicorp/terraform-ls/blob/main/CHANGELOG.md) for details.

In addition, this new version brings the syntax highlighting up to date with all HCL2 features, as needed for Terraform 0.12 and above.

**Configuration Changes** Please note that in 2.x, the configuration differs from 1.4.0, see [Known Issues](#known-issues) for more information.

See the [CHANGELOG](https://github.com/hashicorp/vscode-terraform/blob/main/CHANGELOG.md) for more detailed release notes.

## Known Issues

- Completion inside incomplete blocks, such as `resource "here` (without the closing quote and braces) is not supported. You can complete the 1st level blocks though and that will automatically trigger subsequent completion for e.g. resource types. See [relevant issue](https://github.com/hashicorp/terraform-ls/issues/57) for more.
- A number of different folder configurations (specifically when your root module is not a parent to any submodules) are not yet supported. ([info](https://github.com/hashicorp/terraform-ls/issues/32#issuecomment-649707345))

### Terraform 0.11

If you are using a Terraform version prior to 0.12.0, you can install the pre-transfer version of this extension manually by [following the instructions in the wiki](https://github.com/hashicorp/vscode-terraform/wiki/Install-a-Pre-transfer-Version).

### Configuration Changes

The configuration has changed in v2.X o from 1.4.0. If you are having issues with the Language Server starting, you can reset the configuration to the following:

```json
"terraform.languageServer": {
  "external": true,
  "args": ["serve"]
}
```

## Credits

- [Mikael Olenfalk](https://github.com/mauve) - creating and supporting the [vscode-terraform](https://github.com/mauve/vscode-terraform) extension, which was used as a starting point and inspiration for this extension.
