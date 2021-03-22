# Q1 2021 Roadmap

Each quarter, the team will highlight areas of focus for our work and upcoming research.
Each release will include necessary tasks that lead to the completion of the stated goals as well as community pull requests, enhancements, and features that are not highlighted in the roadmap. This upcoming calendar quarter (January - March 2021) we will be prioritizing the following areas of work:

## Currently In Progress

### Workflow Improvements

- Expanding integration of terraform commands :white_check_mark:
- Expanding validation support :white_check_mark:
- Detecting initialization outside of VS Code :white_check_mark:

### Terraform Workspace Management 

- Add Terraform workspace command execution for accessing module details :white_check_mark:
- Root modules/ init :white_check_mark:
- Include the ability to show the current Terraform workspace, list available workspaces, and switch between them


### Expanded Completion and Hover

The [Terraform language server](https://github.com/hashicorp/terraform-ls), used with the VSCode extension supports basic schema-driven completion. We plan to introduce additional completion and hover capabilities:

- Provide nested navigation symbols (i.e. nested blocks and block attributes) :white_check_mark:
- Modules


## Researching 

- Expression completion
- Code Lens support for `required_providers` block and resources

### Terraform Cloud Integration

`terraform login` integration, and information/status about your cloud workspace for the current root modules

## Disclosures

The product-development initiatives in this document reflect HashiCorp's current plans and are subject to change and/or cancellation at HashiCorp's sole discretion.
