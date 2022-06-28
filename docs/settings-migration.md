# Settings Migration

In v2.24.0 we migrated all settings to conform to common VS Code setting naming conventions. This improves readability in the VS Code Settings UI as well as making the settings easier to discover when typing in the JSON Settings view.

After v2.24.0, if there are old settings left in the User or Workspace scopes, this extension will show a prompt asking to migrate the settings. The user can either automatically migrate, ignore future warnings, open the Settings UI to manually migrate, or click a link for more information.

## Automatic Migration

Automatic migration uses the VS Code Settings API to update your currently settings. It respects the currently set values and migrates settings only if they are set.

> WARNING: Since this process uses the VS Code Settings API, it does rewrite your Settings file. VS Code may rearrange settings or remove comments in this process. If you have comments, a special order, or other customizations please chose to migrate your settings manually.

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

All settings previously under the `terraform-ls` section have been moved to the `terraform` section:

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
"terraform.languageServer.excludeRootModules": [],
"terraform.languageServer.ignoreDirectoryNames": []
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
