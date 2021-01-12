# 2.5.0 (unreleased)

* Add setting for experimental features to enable validateOnSave (#536)
* Add terraform validate command (#540)

# 2.4.0 (2021-01-07)

Features:

* Use amd64 binary to support Apple Silicon Macs (#527)
* Add command and statusbar interface for running terraform init (#495)

Language Server integration:

* Read LS version from stdout (#512)
* Prepare for semantic token based highlighting (#523)

# 2.3.0 (2020-11-12)

Notes:

* Set up integration tests in GitHub actions (#483)

Bugs:

* Fix 32bit downloads of language server (#483)
* Prune nested workspace folders to prevent running multiple language servers for the same directory (#499)
* Prefix workspace command names to prevent multi-instance name collisions (#514)

# 2.2.3 (2020-09-03)

Bugs:

* Update object syntax highlighting to fix unmatched cases (#485)

# 2.2.2 (2020-08-25)

Bugs:

* Fix additional object key matching issues (#478)

# 2.2.1 (2020-08-24)

Bugs:

* Fix object key syntax highlighting (#475)

# 2.2.0 (2020-08-20)

* Perform PGP verification of zip/shasums (#450)
* Upgrade LS client library to major version 6 (#454)
* Add multi-folder workspace support (#448)
* Ensure downloaded zips are deleted (#464)
* Add configuration to exclude root modules (#446)

Bugs:

* Refactor and fix install bugs (#444)
* Fix block syntax labels (#458)
* Fix parenthesis syntax error (#459)
* Fix syntax highlighting for object expressions (#462)

# 2.1.1 (2020-07-15)

* Fix race in shasum verification (#438)

# 2.1.0 (2020-07-14)

* Verify shasum of language server binary on install (#414)
* Add link to language server changelog on completed install (#424)
* Add syntax for object and tuple structural types (#428)
* Add setting for workspace root module configuration (#423)

# 2.0.2 (2020-06-23)

Bugs:

* Hide language server output window to prevent stealing focus (#408)

# 2.0.1

Fix for Marketplace listing issue

# 2.0.0

The Terraform VSCode extension has [a new home at HashiCorp](https://www.hashicorp.com/blog/supporting-the-hashicorp-terraform-extension-for-visual-studio-code/)! We're integrating with a [new language server](https://github.com/hashicorp/terraform-ls) designed to create a stable integration with Terraform through public APIs. When you upgrade to v2.0.0, the new language server will be installed by default, and checking for updates automatically.

Two commands have been added to manage the language server manually, which you can access via the [Command Palette](https://code.visualstudio.com/docs/getstarted/userinterface#_command-palette): "Terraform: Enable Language Server" and "Terraform: Disable Language Server".

If you want to use a custom-built language server, it can be enabled with the Terraform extension setting "terraform.languageServer.pathToBinary". Include the full path and binary name.

In this version, we've updated the syntax highlighting to work under Terraform 0.12. Errors that were seen in trying to read 0.12 files have also been eliminated. Highlighting and other core features will be partially compatible under 0.11 as well but continuing development will only focus on 0.12 and future versions. If you work in 0.11, you should [pin your extension to an earlier version](https://code.visualstudio.com/updates/v1_30#_install-previous-versions).

Other updates:

* Full-document formatting is provided through the language server and [can be configured](https://code.visualstudio.com/docs/editor/codebasics#_formatting) through user or workspace settings
* Added shortcuts (snippets) for variable and for_each syntax -- `fore`, `vare`, `varm`
* For contributors, the TypeScript testing and linting frameworks have been brought current with the recommended packages
* Logos now match the current brand guidelines (pretty snazzy!)
* Auto-completion, hover, and definition features are now managed by the language server, so see their [changelog](https://github.com/hashicorp/terraform-ls/blob/master/CHANGELOG.md) for the most recent updates
* External commands such as `terraform validate` and `tflint` are removed from the extension, but we plan to add hooks for these and/or additional integrations via the language server.
* The outline view and model overview have been removed for now in order to focus on core features

# 1.4.0

Thanks to [@lawrencegripper](https://github.com/lawrencegripper) and [@juliosueiras](https://github.com/juliosueiras) we now have the first release in place which supports Terraform 0.12 using a new and shiny language server. In order to start using the language server you need to change the configuration to enable it or run the command `Terraform: Enable/Disable Language Server` or set `terraform.languageServer.enabled` to `true`.

## New Features

- Terraform 0.12 support 🎉🎆🎉

# 1.3.12

Sadly, I am currently very busy with my work so I cannot dedicate anytime to this project, however I am very lucky to have enthuastic users who have stepped up and started to fix small issues and add some features.

Terraform 0.12 support is still not available, but some progress is being made in issue [Issue 157](https://github.com/mauve/vscode-terraform/issues/157) if you want to see this support land, I would kindly ask you to get involved with the users in that ticket.

## Fixes

- Updated auto-completion data to latest available [Thanks to @ranga543](https://github.com/ranga543)
- Updated syntax-highlighting to better support Terraform 0.12 [Thanks to @MattFenner](https://github.com/MattFenner)
- Add support for Terraform syntax highlighting in Markdown files [Thanks to @stuartleeks](https://github.com/stuartleeks)
- Track references to `modules` (Fixes #165)

# 1.3.11

## Fixes

- Track references in ternary expressions (Fixes #123)
- Track references in heredocs (Fixes #159)
- Track references to modules (Fixes #165)

# 1.3.10

## What's New

- `Terraform: Show Plan` command
- `Terraform: Preview Graph` works again

# 1.3.9

## What's New

- Added autocompletion support for the OCI provider [Thanks to @ASatanicPickle](https://github.com/ASatanicPickle/)

# 1.3.8

## Fixes

- Exclude configured directories from indexing during initial crawl (Fixes #153, #156) [Thanks to @christek91](https://github.com/christek91)

# 1.3.7

## Fixes

- Upgrade ApplicationInsights SDK (Fixes #133)

# 1.3.6

## Fixes

- Do not show a warning if a `terraform {}` statement is missing a `required_version` attribute (Closes #132)

# 1.3.5

## Fixes

- Allow brackets in auto-closing in double quote string [Thanks to @aliusmiles](https://github.com/aliusmiles)
- Fix broken multi-line strings (Closes #109) [Thanks to @squidfunk](https://github.com/squidfunk)
- (Partially fix #118) High-CPU usage on auto-complete [Thanks to @michaelmoussa](https://github.com/michaelmoussa)

## Unimportant news

- Pull-requests no longer require the AppInsights key which means they can actually succeed
- We now correctly parse and compare Terraform versions so that we can evaluate `required_versions` statements (not surfaced in the UI yet)

# 1.3.4

## Fixes

- Fix one error during autocompletion which was reported by telemetry
  - `19be431` Do not parse user input as RegExp
- No longer raise *Output* window on warning or error as it is to intrusive (Closes #115)

# 1.3.3

## Fixes

- Fix one error in the completion provider which would cause it to fail if a single argument was unknown

# 1.3.2

## Fixes

- Fixed two errors which were automatically reported through telemetry:
  - `f2afae1` parseHcl might return error without Position
  - `24884c2` groupFor fails when called with Uri from vscode as opposed to Uri from vscode-uri

# 1.3.1

## Fixes

- Fixed two errors which were automatically reported through telemetry

# 1.3.0

## New Features

- Correctly fold HEREDOCs (closes [#48](https://github.com/mauve/vscode-terraform/issues/48))
- Resources are not correctly groups so that goto definition works as expected (closes [#107](https://github.com/mauve/vscode-terraform/issues/107))
- Looks for all `terraform` binaries in `PATH` and picks the newest
- Show a warning if `erd0s.terraform-autocomplete` is installed as it breaks document links (refer [#102](https://github.com/mauve/vscode-terraform/issues/102))
- Resources are now grouped by folder internally which fixes several reported issues [#103](https://github.com/mauve/vscode-terraform/issues/103)
- Support outline view
- Simple custom view which shows an overview of all modules
  - This is the very first and very simplest version so you cannot really interact with the view.

## Breaking Changes

- Format On Auto-Save is now gone (closes [#112](https://github.com/mauve/vscode-terraform/issues/112) and others, see below for an in-depth explanation)

## Fixes

- Catches exceptions in all commands and providers and reports them automatically (if enabled, closes [#106](https://github.com/mauve/vscode-terraform/issues/106))

## Format On Auto-Save Removal

In one of the very first versions of the Terraform plugin, that is before VSCode had format-on-save
or the auto-save features, the Terraform plugin had its own implementation of format-on-save which
just listened to save events from the editor and then overwrite the files.

Later auto-save was introduced and because the Terraform plugin was listening to save events and
manually performing format on save, that meant that without doing anything we suddenly had
format-on-auto-save.

A while back VSCode introduced a proper API for performing formatting and formatting on save; these
APIs have been in use by the extension since 0.0.20; when these API were introduced they deliberatively
omitted format on auto save, because it breaks development workflows in more complicated languages.

Now the Terraform plugin has started to become relatively complicated in itself with auto completion
support and refactoring support as well as more and more coding features added all the time. As the
usage of the extension has been growing and we have started to see more and more bugs because we
perform format-on-auto-save.

So now I had to remove the feature.

Sorry to all of you who liked the feature. I hope you will keep using my extension regardless of the lack of this feature.

With the removal of this feature the following configuration changes have been made.

1. the Terraform extension no longer supply a default config for `[terraform]editor.formatOnSave: false`, instead
   the default setting of `editor.formatOnSave` applies unless you have overridden it yourself.
1. the setting `terraform.format.enable` is now gone as it doesn't make sense anymore
1. the setting `terraform.formatOnSave` is now gone as it has no effect
   - use `editor.formatOnSave` or `[terraform]editor.formatOnSave` instead

Thanks for using my extension.

# 1.2.3

## Fixes

- Unbreak *Show Workspace Symbols*

# 1.2.2

## Fixes

- Forgot to bundle metrics key

# 1.2.1

## Fixes

- Collect references in math expressions (Closes #95)
- Do not eat property accesses during rename refactoring (Closes #104)

## Unimportant news

- Split tests into unit tests and integration tests
- Added even more build instructions

# 1.2.0

## Fixes

- Browsing workspace symbols works again
- Remove duplicates when suggesting completions (Closes #98)
- Show more information when browsing symbols (Closes #92)
- Add matching syntax for closing brackets [Thanks to @pecigonzalo](https://github.com/pecigonzalo)
- Do no show code-lenses for provider sections (references were incorrect anyway)
- Fix typos in README.md [Thanks to @conradolega](https://github.com/conradolega)

## Unimportant news

- Improved build instructions to make contributions easier
- Upgraded to gulp 4.0.0
- Use gulp for all build steps and workflows

# 1.1.2 (post-humously documented)

## Fixes & Changes

- Literally nothing

# 1.1.1

## Fixes

- Correctly track user session

# 1.1.0

## Features

- Very simple telemetry is now being reported if enabled (currently only an event is recorded when the plugin activates)

## Fixes

- Indexing is now done per workspace folder rather than globally (closes #83)
- HIL parse errors are now correctly handled and surfaced in the *Problems* view

## Telemetry

Currently only a simple `activated` event is being recorded. All events include the version of VSCode and
some other automatically provided properties by VSCode (refer: [Common Properties](https://github.com/Microsoft/vscode-extension-telemetry#common-properties)).

The plugin respects the global telemetry opt-out (`telemetry.enableTelemetry`) setting but you can also
disable telemetry collection for just this plugin by setting `terraform.telemetry.enabled` to `false`.

You can read more about telemetry reporting in VSCode in the [FAQ](https://code.visualstudio.com/Docs/supporting/FAQ#_how-to-disable-telemetry-reporting).

# 1.0.8

## Fixes

- Correctly set current working directory when calling `tflint` (Closes #82)

# 1.0.7

## New Features

- Correctly index and support `locals {}` in hover, references and so on...

## Fixes

- Ensure `tflint` execution errors show up in the *Output* tab

# 1.0.6

## New Features

- Autocomplete now autocomplete builtin interpolation functions
- Autocomplete in interpolation should be more robust
- `.tfvars` Files are now correctly indexed so that *Go To definition*, *Rename* more now work as expected (Closes #80)
- Autocomplete of top-level sections (e.g. `resource`, `variable` for example) now uses snippets to speed up authoring

## Experimental features

- Invoking the command `terraform.preview-graph` (*Terraform: Preview Graph*) will generate and show a clickable resource dependency graph

## Fixes

- Correctly syntax highlight the `locals {}` keyword

# 1.0.5

## New Features

- The Hover now shows values of more references (previously only variable `default` were shown)

## Fixes

- Correctly parse references to list and map variables as well as references in nested expressions (Closes #75)

# 1.0.4

## Fixes

- Correctly add `minimatch` to dependencies (Closes #74)

# 1.0.3

## New Features

- Support region for code-folding (`#region`, `#endregion`) (closes #63)
- Add document links to the official terraform documentation (closes #68)

# 1.0.2

## New Features

- CodeLens contribution can be disabled via configuration (closes #73)
- Make it possible to exclude paths from indexing (by default excludes `.terraform`, closes #72)

# 1.0.1 (bugfix)

## Fixes

- Fix racecondition during startup of larger projects

# 1.0.0

## New Features

- Indexing support is no longer experimental
- Indexing support no longer requires a separate tool (HCL parsing is now built directly into the plugin)
- *Rename refactoring* now supports all types
- Hovering a variable shows the default value
- A code lens shows how often a resource (or variable, or data) is referenced
- Terraform now works with *Visual Studio LiveShare* (thanks to [@lostintangent](https://github.com/lostintangent))

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
