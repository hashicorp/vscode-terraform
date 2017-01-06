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

