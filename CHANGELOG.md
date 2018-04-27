# 0.0.23

## Fixes

- Typo in README.md which broke the auto-complete preview [@chroju](https://github.com/chroju)

# 0.0.22

## Fixes

- Do not require `terraform.index.enabled` to be true in order for auto-completion to work
- Fix a small typo which makes `Format Document` command fail
- Correctly bundle auto-completion data files

# 0.0.21

## What's New

- Auto completion support [@ranga543](https://github.com/ranga543)
- Format on save is back (closes #45, #47)
- Tools can now be installed in directories which have spaces [@xeres](https://github.com/xeres)

### Format on save

The last version introduced usage of the correct extension APIs for registering formatting
providers. VSCode then automatically invokes the formatting provider on save if `editor.formatOnSave` has been specified. VSCode however does never invoke the formatting
provider if the save operation came from an auto-save event.

0.0.21 reintroduces the manual code which handled format on autosave instead of relying on
VSCode to perform those operations. The following configuration options have changes as result
of that:

- `terraform.format.enable`: needs to be `true`
- `terraform.format.formatOnSave`: needs to be `true`
- `terraform.format.ignoreExtensionsOnSave`: can be used to exclude `.tfvars` for example from autosave formatting

The global setting: `editor.formatOnSave` should be `false` for Terraform files and the
extension contributes that default configuration. Please verify that you do not have
conflicting configuration, by removing the following setting if you have it:

```json
"[terraform]": {
  "editor.formatOnSave": true
}
```

The configuration `editor.formatOnSave` will have the correct setting contributed by Terraform.

# 0.0.20

## What's New

- The formatter now uses the correct Formatting API so that the builtin command for formatting works as expected (closes #42)
- The formatter no longer has a hardcoded list of approved extensions, instead if the document type is 'terraform' then the formatter can be used to that file (closes #41)
- The introduced formatter changes means that the plugin specific configuration for formatting (e.g. `terraform.formatOnSave`) have been deprecated and are no longer used.

# 0.0.19

## What's New

- Mark `.tfstate` files as JSON (closes #38)
- Remove unnecessary files from package
- Show output channel on validation failure [@jackric](https://github.com/jackric)

# 0.0.18

## What's New

- Add support for local variable type [@mspaulding06](https://github.com/mspaulding06)

# 0.0.17

## What's New

- Several great syntax highlighting fixes by [@haad](https://github.com/haad)
- We no longer create several output channels (closes #25)

# 0.0.16 (0.0.15)

## What's New

- Tiny bugfix for "Browse symbols" where a results would not get shown
- More tiny bugfixes for index

# 0.0.14

## What's New

- Experimental new Indexing support using [terraform-index](https://github.com/mauve/terraform-index)
  - Browse document symbols
  - Browse workspace symbols
  - Peek definition
  - Goto definition
  - Find references
  - Completion for variables and outputs
  - Rename variables (and all usages)

# 0.0.13

## What's New

- Much better marketplace description
- Minor fixes

# 0.0.12

## What's New

- Add linting support using [tflint](https://github.com/wata727/tflint) (Closes #12)

# 0.0.11

## What's New

- Only run `terraform fmt` on terraform files so that the plugin can be used for `HCL` files in general (Closes #18)
- Syntax highlight string interpolations in heredocs

# 0.0.10

## What's New

- Add a command to run `terraform validate`
- Also handle `.hcl` files (Closes #17)
- Update screenshot in README.md

# 0.0.8

## What's New

- Also highlight interpolations and function calls inside strings

# 0.0.7

## What's New & Changes

- [Add auto closing and surrounding pairs](https://github.com/mauve/vscode-terraform/pull/10)
- `terraform.formatOnSave` is now disabled by default due to some minor
  issues I want to improve before enabling it again
- Added new configuration option `terraform.formatVarsOnSave` which
  controls whether to format `.tfvars` files on save, by default this
  setting mirrors `terraform.formatOnSave`

# 0.0.6

## What's New

All changes for this release have been contributed by @madssj.

- [Added basic `terraform fmt` runner](https://github.com/mauve/vscode-terraform/pull/6)
  - Adds the ability to invoke `terraform fmt` on save or on the current file
  - Adds two configuration options `terraform.formatOnSave` and `terraform.path`
- [Added block comments in the language specification](https://github.com/mauve/vscode-terraform/pull/7)
  - Fixes [`/* */ don't show as commented` #4](https://github.com/mauve/vscode-terraform/issues/4)

# 0.0.5

## What's New

- [Update the line comment to # instead //](https://github.com/mauve/vscode-terraform/pull/1)
  - This PR fixes the _automated block commenting and uncommenting_ `Ctrl+/` which previously
    used the wrong kind of comments.

# 0.0.4

- Fixed screenshot in README.md

# 0.0.3

## What's New

- [Added support for 'data' resources](https://github.com/mauve/vscode-terraform/pull/2)

# 0.0.2

- Initial version
