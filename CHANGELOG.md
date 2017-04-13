0.0.12
======

## What's New
- Add linting support using [tflint](https://github.com/wata727/tflint) (Closes #12)

0.0.11
======

## What's New
- Only run `terraform fmt` on terraform files so that the plugin can be used for `HCL` files in general (Closes #18)
- Syntax highlight string interpolations in heredocs

0.0.10
======

## What's New
- Add a command to run `terraform validate`
- Also handle `.hcl` files (Closes #17)
- Update screenshot in README.md

0.0.8
=====

## What's New
- Also highlight interpolations and function calls inside strings

0.0.7
=====

## What's New & Changes
- [Add auto closing and surrounding pairs](https://github.com/mauve/vscode-terraform/pull/10)
- `terraform.formatOnSave` is now disabled by default due to some minor
  issues I want to improve before enabling it again
- Added new configuration option `terraform.formatVarsOnSave` which
  controls whether to format `.tfvars` files on save, by default this
  setting mirrors `terraform.formatOnSave`

0.0.6
=====

## What's New
All changes for this release have been contributed by @madssj.

- [Added basic `terraform fmt` runner](https://github.com/mauve/vscode-terraform/pull/6)
  - Adds the ability to invoke `terraform fmt` on save or on the current file
  - Adds two configuration options `terraform.formatOnSave` and `terraform.path`
- [Added block comments in the language specification](https://github.com/mauve/vscode-terraform/pull/7)
  - Fixes [`/* */ don't show as commented ` #4](https://github.com/mauve/vscode-terraform/issues/4)

0.0.5
=====

## What's New
- [Update the line comment to # instead //](https://github.com/mauve/vscode-terraform/pull/1)
  - This PR fixes the _automated block commenting and uncommenting_ `Ctrl+/` which previously
    used the wrong kind of comments.

0.0.4
=====

- Fixed screenshot in README.md

0.0.3
=====

## What's New
- [Added support for 'data' resources](https://github.com/mauve/vscode-terraform/pull/2)

0.0.2
=====

- Initial version

