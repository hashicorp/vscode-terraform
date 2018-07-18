<!-- markdownlint-disable -->
<h1 align="center">
  <br>
    <img src="https://raw.githubusercontent.com/mauve/vscode-terraform/master/terraform.png" alt="logo" width="200">
  <br>
  vscode-terraform
  <br>
  <br>
</h1>

<h4 align="center">Adds intelligent auto-completion features for <a href="https://www.terraform.io/">Terraform</a> files</h4>

<p align="center">
  <a href="https://tfci.westus2.cloudapp.azure.com/job/vscode_terraform/">
    <img src="http://img.shields.io/travis/zunlihu/vscode-terraform.svg?branch=master">
  </a>
</p>
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


## Resource Auto-Completion

- `resource` key word completion.

-  Resource Types auto-completion with bucket when you type `""` after resource key word.  
   Note: Here resource types are recommended **with priority**!

-  After the definition of name, when you type `{}`, the `Default Parameter` auto-loading will works.

-  For the `Optional` parameters or properties, if you need, when you type the first letter, auto-completion support with property description works.

IMAGE!!!!!

## Data Auto-Completion 
- `data` key word completion.

-  Data Types auto-completion with bucket when you type `""` after resource key word.
   Note: Here data types are recommended **with priority**.

-  After the definition of name, when you type `{}`, the `Default Parameter` auto-loading will works.

-  For the `Optional` parameters or properties, if you need, when you type the first letter, auto-completion support with property description works.

IMAGE!!!!!

## Module Auto-Completion
- `module` bucket completion with source auto-loading.

-  In `module`, parameter `source` types auto-completion with other required parameters when you type `""` after `source = `.
   Note: Here source types are recommended **with priority**.

-  For the `Optional` parameters or properties, if you need, when you type the first letter, auto-completion support with property description works.

IMAGE!!!!! 

## Hyperlink
The hyperlink of resource types, data types, module source type swill automatically works, which can be used to browse `Example Usage` website conveniently.

**Note**: If there are lint errors in the file, the hyperlink will not work. But when you correct the errors, it works automatically.
