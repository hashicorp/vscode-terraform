<!-- markdownlint-disable -->
<h1 align="center">
  <br>
    <img src="https://raw.githubusercontent.com/mauve/vscode-terraform/master/terraform.png" alt="logo" width="200">
  <br>
  vscode-terraform
  <br>
</h1>
<h4 align="center">Adds intelligent auto-completion features for <a href="https://www.terraform.io/">Terraform</a> files</h4>


<!-- markdownlint-enable -->
<!-- markdownlint-disable MD002 MD013 MD041 -->

## Features at a glance
### Auto-completion features
  1. `Terraform` high level types `(resource, data, variable, output,  module ...)` auto completion support.
   - ![](https://github.com/zunlihu/Terraform-Language-Server/blob/master/images/Keyword.PNG) ```resource``` and `data` without bucket
   - ![](https://github.com/zunlihu/Terraform-Language-Server/blob/master/images/variable.PNG) ```variable``` and `output` with bucket
   - ![](https://github.com/zunlihu/Terraform-Language-Server/blob/master/images/modules.PNG) ```module``` with bucket
  
  2. `resource` types & `data` types auto completion support for [all providers](https://www.terraform.io/docs/providers/index.html), including azurerm, aws, google, alicloud and etc.
  
  3. `module` `source` parameter auto-completion support for [all providers](https://registry.terraform.io/) with required parameters auto-loading.
  
  4. `resource | data` default(required) parameters auto-completion.
  
  5. `resource | data | module | output | variable` property types auto completion support
  
### Others
  1. Hyperlink for resource, data types and module sources, which is linked to Example Usage Web.

## Install from *.vsix in Jenkins
- Find and download *.vsix in Jenkins. 
 `vscode_terraform`->`artifacts`->`${buildNum}`->`terraform-${version}.vsix`
- Install in Visual Studio Code:
  - **The First Method (Recommend)**：
	 Press `Ctrl`+`Shift`+`P` and select  `Extensions: Install from VSIX...` command in the Command Palette, then point to the target .vsix file you just downloaded.

  - The Second Method ：
You can also install using the VS Code ```--install-extension``` command line switch providing the path to the .vsix file.
		
		```
		code --install-extension terraform-1.1.2.vsix
		```
## Try Resource Auto-Completion

- `resource` key word completion.

-  Resource Types auto-completion with bucket when you type `""` after resource key word.  
   Note: Here resource types are recommended **with priority**!

-  After the definition of name, when you type `{}`, the `Default Parameter` auto-loading will works.

-  For the `Optional` parameters or properties, if you need, when you type the first letter, auto-completion support with property description works. If you are not familiar with the usage of resource, you can just click the hyperlink in resource types and find Example Usage.

![](https://github.com/zunlihu/vscode-terraform/blob/master/images/resource-auto-completion.gif)

## Try Data Auto-Completion 
- `data` key word completion.

-  Data Types auto-completion with bucket when you type `""` after resource key word.
   Note: Here data types are recommended **with priority**.

-  After the definition of name, when you type `{}`, the `Default Parameter` auto-loading will works.

-  For the `Optional` parameters or properties, if you need, when you type the first letter, auto-completion support with property description works. In addition, if you are not familiar with the usage of data source, you can just click the hyperlink in data types and find Example Usage.

![](https://github.com/zunlihu/vscode-terraform/blob/master/images/data-auto-completion.gif)

## Try Module Auto-Completion
- `module` bucket completion with source auto-loading.

-  In `module`, parameter `source` types auto-completion with other required parameters when you type `""` after `source = `.
   Note: Here source types are recommended **with priority** based on the downloads in module registry.

-  For the `Optional` parameters or properties, if you need, when you type the first letter, auto-completion support with property description works. And when you select one of the module parameters, the **default value** of the parameter will be auto-loaded, too.

- In addition, if you are not familiar with the usage of module source, you can just click the hyperlink in module source parameter and find Example Usage.

![](https://github.com/zunlihu/vscode-terraform/blob/master/images/module-auto-completion.gif)

## Hyperlink
The hyperlink of resource types, data types, module source types will automatically works, which can be used to browse `Example Usage` website conveniently.

**Note**: If there are lint errors in the file, the hyperlink will not work. But when you correct the errors, it works automatically.
