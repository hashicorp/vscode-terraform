# Settings Migration

In v2.24.0 we migrated all settings to conform to common VS Code setting naming conventions. This improves readability in the VS Code Settings UI as well as making the settings easier to discover when typing in the JSON Settings view.

## Manual Migration

The `terraform.languageServer` setting block has been extracted out to individual settings.

In addition, `terraform.languageServer.external` has been renamed to `terraform.languageServer.enable`

<table>
<tr><td>Old</td><td>New</td></tr>
<tr>
<td>

```json
"terraform.languageServer": {
  "external": true,
  "pathToBinary": "",
  "args": [ "serve" ],
  "ignoreSingleFileWarning": false
},
```
</td>
<td>

```json
"terraform.languageServer.enable": true,
"terraform.languageServer.pathToBinary": "",
"terraform.languageServer.args": [ "serve" ],
"terraform.languageServer.ignoreSingleFileWarning": false
```

</td>
</tr>
</table>

The `terraform-ls.terraformExec` settings have been moved to the `terraform` section and have been renamed:

<table>
<tr><td>Old</td><td>New</td></tr>
<tr>
<td>

```json
"terraform-ls.terraformExecPath": "",
"terraform-ls.terraformExecTimeout": "",
"terraform-ls.terraformExecLogFilePath": ""
```

</td>
<td>

```json
"terraform.languageServer.terraform.path": "",
"terraform.languageServer.terraform.timeout": "",
"terraform.languageServer.terraform.logFilePath": ""
```

</td>
</tr>
</table>

All settings previously under the `terraform-ls` section have been moved to the `terraform` section and a new `indexing` subsection:

<table>
<tr><td>Old</td><td>New</td></tr>
<tr>
<td>

```json
"terraform-ls.rootModules": [],
"terraform-ls.excludeRootModules": [],
"terraform-ls.ignoreDirectoryNames": []
```

</td>
<td>

```json
"terraform.languageServer.rootModules": [],
"terraform.languageServer.indexing.ignorePaths": [],
"terraform.languageServer.indexing.ignoreDirectoryNames": []
```

</td>
</tr>
</table>

The `terraform.experimentalFeatures` setting block has been extracted out to individual settings:

<table>
<tr><td>Old</td><td>New</td></tr>
<tr>
<td>

```json
"terraform.experimentalFeatures": {
  "validateOnSave": false,
  "prefillRequiredFields": false,
},
```
</td>
<td>
    
```json
"terraform.experimentalFeatures.validateOnSave": false,
"terraform.experimentalFeatures.prefillRequiredFields": false,
```

</td>
</tr>
</table>

For an easy to view table of settings, see the `Contributions` tab when viewing the Terraform Extension in the VS Code Extension Pane.

## Setting Scope

This extension has several settings that allow users to customize an executable path for different functions. These paths can vary depending on where the extension is running.

As of v2.24.0, the extension uses the `machine` scope for the following settings:

```
terraform.languageServer.path
terraform.languageServer.args
terraform.languageServer.tcp.port
terraform.languageServer.terraform.path
terraform.languageServer.terraform.logFilePath
terraform.languageServer.terraform.timeout
terraform.languageServer.rootModules
terraform.languageServer.excludeRootModules
terraform.languageServer.ignoreDirectoryNames
```

> **Note**: This means these settings are no longer able to be configred in the Workspace or Folder setting scopes. For more information about setting scope see the VS Code [setting documentation](https://code.visualstudio.com/docs/getstarted/settings)

This will allow VS Code to know where to read each setting depending on where the extension is running. For example: running locally on a Windows desktop, or in a WSL instance, or remotely in a GitHub Codespace or a Remote SSH session. VS Code understands where the extension is "running" and can read settings from the proper location, if the settings are properly scoped.
