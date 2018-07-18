# Terraform Language Server

The Language Server protocol is used between a tool (the client) and a language smartness provider (the server) to integrate features like auto complete, goto definition, find all references and alike into the tool.

HashiCorp Terraform enables you to safely and predictably create, change, and improve infrastructure. It is an open source tool that codifies APIs into declarative configuration files that can be shared amongst team members, treated as code, edited, reviewed, and versioned.

There is no full-featured language server protocol for terraform files,e.g. .tf or .hcl file. With the development of cloud technology and terraform, it is urgent and meaningful to improve such a language server for all terraform developers.

The terraform language server will be published in Visual Studio Code as an extension tool. The extension mainly work in two aspects:

 - **Language Intelligence**- Including syntax highlighting, **auto-completion**, **intelligent recommendation**, goto definition, find references and etc.
 - **Command Integration**- Including simple commands which can directly deploy resources in popular cloud platform such as aws, azure, google cloud and so on.
 

![System Architecture image](https://github.com/zunlihu/Terraform-Language-Server/blob/master/images/System%20Architecture.png "System Architecture")

## Language Intelligence

### Auto-completion 

Auto-completion can be seen as the several parts:

- variable, resource, data, module ... auto completion.
- resource types auto completion for aws, azure, google cloud and etc.
- resource | data | module | output | variable property types auto completion.
- resource | data 1-level nested block property types auto completion.

![](https://github.com/zunlihu/Terraform-Language-Server/blob/master/images/terraform-auto-completion.gif)

### Intelligent recommendation
Through parsing the .tf files to AST, abstract the program code to sentences. Try popular RNN or other deep learning methods to capture the context information in the code and then recommend the resources/modules users want to user.

The ML process can be seen as nlp, just showed as follows. 

![](https://github.com/zunlihu/Terraform-Language-Server/blob/master/images/ML.PNG)

**important problem:**

1. How to get AST? HCL parser
2. How to use AST? 
3. How to get enough data source?
  - data scraping
4. baseline: frequency
5. improve: ML(key: find enough data source and suitable algorithm)
6. consider future improvement with more users and data source.

### Syntax highlighting
![](https://github.com/zunlihu/Terraform-Language-Server/blob/master/images/screenshot.png)

### Linting
![](https://github.com/zunlihu/Terraform-Language-Server/blob/master/images/screenshot-tflint.png)

### Document link support
![](https://github.com/zunlihu/Terraform-Language-Server/blob/master/images/terraform-document-link-2.png)

### Find reference
![](https://github.com/zunlihu/Terraform-Language-Server/blob/master/images/terraform-find-references.png)

### Goto definition 

### Rename 

Rename variables, resource, data types and all references.

When you try to name a variable by a used string, the editor will recommend another one as follows:
![](https://github.com/zunlihu/Terraform-Language-Server/blob/master/images/terraform-rename-variable-before.png)

And you can just user the recommended names, the code will be in the following format.
![](https://github.com/zunlihu/Terraform-Language-Server/blob/master/images/terraform-rename-variable-after.png)

## Command Integration

For Azure, it should cooperate with Azure CLI 2.0.