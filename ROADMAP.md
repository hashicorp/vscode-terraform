# Q4 2020 Roadmap

Each quarter, the team will highlight areas of focus for our work and upcoming research.
Each release will include necessary tasks that lead to the completion of the stated goals as well as community pull requests, enhancements, and features that are not highlighted in the roadmap. This upcoming calendar quarter (October - December 2020) we will be prioritizing the following areas of work:

## Currently In Progress

### Workflow Improvements

- Integration of terraform init, plan, and apply commands
- Preloaded provider schemas for completion before init

### Terraform Workspace Management 

- Add workspace command execution for accessing module details
- Support for running terraform init on a selected module
- Include the ability to show the current terraform workspace, list available workspaces, and switch between them

### Expanded Completion and Hover

The [Terraform language server](https://github.com/hashicorp/terraform-ls), used with the VSCode extension supports basic schema-driven completion. We plan to introduce additional completion and hover capabilities:

- Modules
- Built-in block types (ie. Terraform block, backends, provisioners, variables, locals, outputs)
- Provide nested navigation symbols (i.e. nested blocks and block attributes)
- Documentation on hover

## Researching 

### Terraform Cloud Integration

`terraform login` integration, and information/status about your cloud workspace for the current root modules


## Disclosures

The product-development initiatives in this document reflect HashiCorp's current plans and are subject to change and/or cancellation at HashiCorp's sole discretion.
