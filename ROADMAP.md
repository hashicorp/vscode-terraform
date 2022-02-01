# Q1 2022 Roadmap

Each quarter, the team will highlight areas of focus for our work and upcoming research.
Each release will include necessary tasks that lead to the completion of the stated goals as well as community pull requests, enhancements, and features that are not highlighted in the roadmap. 

## Reflecting on 2021

In 2021 we expanded and welcomed [@dbanck](https://github.com/dbanck) and [@jpogran](https://github.com/jpogran) to the team, joining [@radeksimko](https://github.com/radeksimko). These new additions bring a wealth of experience in maintaining popular VS Code extensions and bolstering the team's front-end expertise.

During the last year we shipped (April 2021 - Jan 2022):

- 10 major releases
- 16 new features/enhancements
- 13 bugs fixed

### Release Highlights

- Improved highlighting for Terraform 0.15 to 1.0 via semantic highlighting
- Support for Terraform variable files (tfvars)
- Links to provider documentation
- Basic go-to-attribute/block and go-to-reference
- Workspace-wide symbol navigation
- Completion of required attributes for blocks
- Module calls and providers views added to Explorer Pane
- Reference Count code lens
- Significantly improved client startup reliability including a shift to publishing platform specific extensions.

## Roadmap Items

This upcoming quarter (February - April 2022) we will be prioritizing the following areas of work:

### Enhanced Module Support

Issue: [#715](https://github.com/hashicorp/vscode-terraform/issues/715)

Terraform Modules are widely used to package and allow reuse of Terraform Configurations. Unfortunately, at present editing configurations with modules does not provide the same experience in VSCode as configurations without it, as some features (such as go-to-definition, go-to-references, completion of inputs/outputs etc.) do not work reliably in cases involving modules. This quarter we intend to improve support for modules, so that users can take advantage of the same comfort and features while using modules . 

### Syntax Highlighting

Issue [#638](https://github.com/hashicorp/vscode-terraform/issues/638) 

Improve syntax highlighting in all HCL languages by extracting the existing Terraform textmate grammar into product-agnostic HCL that can be applied into product specific and unit tested textmate grammar files. These grammar files will be available in a central repository for use in editors that support textmate grammars like VS Code and Sublime Text, and eventually even Github in the browser.

### Linter Integration & Code Actions

Issue [#635](https://github.com/hashicorp/vscode-terraform/issues/635)

Integrating linting tools (such as tflint) into the extension is one of the most upvoted community issues. The integration allows users to see validation results inline in their code editor, reducing the need for tool and context switches. In this quarter we will align on a standardized design and interface and hope to ship partial support.

## Disclosures

The product-development initiatives in this document reflect HashiCorp's current plans and are subject to change and/or cancellation at HashiCorp's sole discretion.
