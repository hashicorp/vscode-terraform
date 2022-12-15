## [2.25.2] (2022-12-15)

BUG FIXES:

 - Improve attribute name matching ([syntax#49](https://github.com/hashicorp/syntax/pull/49))

## [2.25.1] (2022-12-01)

ENHANCEMENTS:

 - All past versions of the extension were backfilled into [OpenVSX Registry](https://open-vsx.org) and future versions will become available automatically ([#1064](https://github.com/hashicorp/vscode-terraform/pull/1064))

 - Support `count.index` references in blocks with `count` for completion, hover documentation and semantic tokens highlighting ([terraform-ls#860](https://github.com/hashicorp/terraform-ls/issues/860), [hcl-lang#160](https://github.com/hashicorp/hcl-lang/pull/160))
 - Support `each.*` references in blocks with `for_each` for completion, hover documentation and semantic tokens highlighting ([terraform-ls#861](https://github.com/hashicorp/terraform-ls/issues/861), [hcl-lang#162](https://github.com/hashicorp/hcl-lang/pull/162))
 - Support `self.*` references in `provisioner`, `connection` and `postcondition` blocks for completion, hover documentation and semantic tokens highlighting ([terraform-ls#859](https://github.com/hashicorp/terraform-ls/issues/859), [hcl-lang#163](https://github.com/hashicorp/hcl-lang/pull/163))
 - `dynamic` block support, including label and content completion ([terraform-ls#530](https://github.com/hashicorp/terraform-ls/issues/530), [hcl-lang#154](https://github.com/hashicorp/hcl-lang/pull/154))
 - Go-to-definition/go-to-references for `count.index`/`count` ([terraform-ls#1093](https://github.com/hashicorp/terraform-ls/issues/1093))
 - Go-to-definition/go-to-references for `each.*`/`for_each` ([terraform-ls#1095](https://github.com/hashicorp/terraform-ls/issues/1095))
 - Go-to-definition/go-to-references for `self.*` in `provisioner`, `connection` and `postcondition` blocks ([terraform-ls#1096](https://github.com/hashicorp/terraform-ls/issues/1096))
 - Remove deprecated backends in Terraform 1.3.0 ([terraform-schema#159](https://github.com/hashicorp/terraform-schema/pull/159))

## [2.25.0] (2022-11-14)

ENHANCEMENTS:

 - Publish Terrafor Web Extension by [#1210](https://github.com/hashicorp/vscode-terraform/pull/1210)

INTERNAL:

 - Use `npm ci` for installing dependencies inside CI [#1257](https://github.com/hashicorp/vscode-terraform/pull/1257)
 - Enable publishing web extensions [#1262](https://github.com/hashicorp/vscode-terraform/pull/1262)
 - [COMPLIANCE] Update MPL 2.0 LICENSE [#1247](https://github.com/hashicorp/vscode-terraform/pull/1247)

## [2.24.3] (2022-10-13)

ENHANCEMENTS:

 - Significantly reduce the memory footprint of the language server by 85% to 98% for most users ([terraform-ls#1071](https://github.com/hashicorp/terraform-ls/pull/1071))

BUG FIXES:

 - Fix enable terraform-ls after disabling [#1238](https://github.com/hashicorp/vscode-terraform/pull/1238)
 - fix: Enable IntelliSense for resources & data sources whose name match the provider (e.g. `data`) ([terraform-ls#1072](https://github.com/hashicorp/terraform-ls/pull/1072))
 - fix: avoid infinite recursion (surfaced as crash with "goroutine stack exceeds 1000000000-byte limit" message) ([terraform-ls#1084](https://github.com/hashicorp/terraform-ls/pull/1084))
 - fix: race condition in terraform-schema (surfaced as crash with "fatal error: concurrent map read and map write" message) ([terraform-ls#1086](https://github.com/hashicorp/terraform-ls/pull/1086))

INTERNAL:

 - Reduce duplicate error telemetry [#1230](https://github.com/hashicorp/vscode-terraform/pull/1230)


## [2.24.2] (2022-09-07)

ENHANCEMENTS:

 - Ask user to use Remote WSL Extension when using WSL UNC Paths [#1219](https://github.com/hashicorp/vscode-terraform/pull/1219)

BUG FIXES:

 - fix: Improve IntelliSense accuracy by tracking provider schema versions (bug introduced in 2.24.0) ([terraform-ls#1060](https://github.com/hashicorp/terraform-ls/pull/1060))
 - Don't query the Terraform Registry for module sources starting with `.` in completion ([terraform-ls#1062](https://github.com/hashicorp/terraform-ls/pull/1062))
 - fix race condition (panic) in schema merging ([terraform-schema#137](https://github.com/hashicorp/terraform-schema/pull/137))

INTERNAL:

- Improve error telemetry [#1215](https://github.com/hashicorp/vscode-terraform/pull/1215)

## [2.24.1] (2022-08-24)

ENHANCEMENTS:

 - Add link to post explaining vim plugin installation ([terraform-ls#1044](https://github.com/hashicorp/terraform-ls/pull/1044))

BUG FIXES:

 - Fix panic on obtaining provider schemas ([terraform-ls#1048](https://github.com/hashicorp/terraform-ls/pull/1048))
 - Use correct ldflag (versionPrerelease) when compiling LS ([terraform-ls#1043](https://github.com/hashicorp/terraform-ls/pull/1043))

## [2.24.0] (2022-08-23)

BREAKING CHANGES:

 - Raise minimum VS Code version from 1.61.1 to 1.65.2 ([#1176](https://github.com/hashicorp/vscode-terraform/pull/1176))
 - Add migration wizard to aid migrating [extension settings](https://github.com/hashicorp/vscode-terraform/blob/v2.24.0/docs/settings-migration.md) to follow VS Code setting naming conventions and align better with the naming convention of language server settings ([#1156](https://github.com/hashicorp/vscode-terraform/pull/1156), [#1193](https://github.com/hashicorp/vscode-terraform/pull/1193))
 - Setting [`terraform.languageServer`](https://github.com/hashicorp/vscode-terraform/blob/v2.24.0/docs/settings-migration.md)  block has been extracted out to individual settings ([#1156](https://github.com/hashicorp/vscode-terraform/pull/1156), [#1193](https://github.com/hashicorp/vscode-terraform/pull/1193))
 - Setting [`terraform.languageServer.external`](https://github.com/hashicorp/vscode-terraform/blob/v2.24.0/docs/settings-migration.md) has been renamed to `terraform.languageServer.enable` ([#1156](https://github.com/hashicorp/vscode-terraform/pull/1156), [#1193](https://github.com/hashicorp/vscode-terraform/pull/1193))
 - Setting [`terraform.languageServer.pathToBinary`](https://github.com/hashicorp/vscode-terraform/blob/v2.24.0/docs/settings-migration.md) has been renamed to `terraform.languageServer.path` ([#1156](https://github.com/hashicorp/vscode-terraform/pull/1156), [#1193](https://github.com/hashicorp/vscode-terraform/pull/1193))
 - Setting [`terraform-ls.terraformExecPath`](https://github.com/hashicorp/vscode-terraform/blob/v2.24.0/docs/settings-migration.md) has been renamed to `terraform.languageServer.terraform.path` ([#1156](https://github.com/hashicorp/vscode-terraform/pull/1156), [#1193](https://github.com/hashicorp/vscode-terraform/pull/1193))
 - Setting [`terraform-ls.terraformExecTimeout`](https://github.com/hashicorp/vscode-terraform/blob/v2.24.0/docs/settings-migration.md) has been renamed to `terraform.languageServer.terraform.timeout` ([#1156](https://github.com/hashicorp/vscode-terraform/pull/1156), [#1193](https://github.com/hashicorp/vscode-terraform/pull/1193))
 - Setting [`terraform-ls.terraformExecLogFilePath`](https://github.com/hashicorp/vscode-terraform/blob/v2.24.0/docs/settings-migration.md) has been renamed to `terraform.languageServer.terraform.logFilePath` ([#1156](https://github.com/hashicorp/vscode-terraform/pull/1156), [#1193](https://github.com/hashicorp/vscode-terraform/pull/1193))
 - Setting [`terraform-ls.rootModules`](https://github.com/hashicorp/vscode-terraform/blob/v2.24.0/docs/settings-migration.md) has been deprecated and is ignored. Users should instead leverage the VS Code workspace functionality and add the folder to a workspace to be indexed ([#1003](https://github.com/hashicorp/terraform-ls/pull/1003))
 - Setting [`terraform-ls.excludeModulePaths`](https://github.com/hashicorp/vscode-terraform/blob/v2.24.0/docs/settings-migration.md) has been renamed to `terraform.languageServer.indexing.ignorePaths` ([#1003](https://github.com/hashicorp/terraform-ls/pull/1003))
 - Setting [`terraform-ls.ignoreDirectoryNames`](https://github.com/hashicorp/vscode-terraform/blob/v2.24.0/docs/settings-migration.md) has been renamed to `terraform.languageServer.indexing.ignoreDirectoryNames` ([#1156](https://github.com/hashicorp/vscode-terraform/pull/1156), [#1193](https://github.com/hashicorp/vscode-terraform/pull/1193))
 - Setting [`terraform.experimentalFeatures`](https://github.com/hashicorp/vscode-terraform/blob/v2.24.0/docs/settings-migration.md) setting block has been extracted out to individual settings ([#1156](https://github.com/hashicorp/vscode-terraform/pull/1156), [#1193](https://github.com/hashicorp/vscode-terraform/pull/1193))
 - Set proper scope for machine based extension settings ([#1164](https://github.com/hashicorp/vscode-terraform/pull/1164))

ENHANCEMENTS:

 - Use dark extension icon for preview extension ([#1143](https://github.com/hashicorp/vscode-terraform/pull/1143))
 - Introduce support for extension connecting to LSP over TCP, with port configurable via `terraform.languageServer.tcp.port` ([#755](https://github.com/hashicorp/vscode-terraform/pull/755))
 - New Terraform View side bar ([#1171](https://github.com/hashicorp/vscode-terraform/pull/1171))
 - Only show language server related commands when they're relevant ([#1178](https://github.com/hashicorp/vscode-terraform/pull/1178))
 - Replace internal watcher (used for watching changes in installed plugins and modules) with LSP dynamic capability registration & `workspace/didChangeWatchedFiles`. This should lead to improved performance in most cases. ([terraform-ls#953](https://github.com/hashicorp/terraform-ls/pull/953))
 - Provide completion, hover and docs links for uninitialized Registry modules ([terraform-ls#924](https://github.com/hashicorp/terraform-ls/pull/924))
 - Provide basic IntelliSense (except for diagnostics) for hidden `*.tf` files ([terraform-ls#971](https://github.com/hashicorp/terraform-ls/pull/971))
 - Introduce v1.1 `terraform` `cloud` block ([terraform-schema#117](https://github.com/hashicorp/terraform-schema/pull/117))
 - Introduce v1.1 `moved` block ([terraform-schema#121](https://github.com/hashicorp/terraform-schema/pull/121))
 - Introduce v1.2 `lifecycle` conditions ([terraform-schema#115](https://github.com/hashicorp/terraform-schema/pull/115))
 - Introduce v1.2 `lifecycle` `replace_triggered_by` ([terraform-schema#123](https://github.com/hashicorp/terraform-schema/pull/123))
 - Use `module` declarations from parsed configuration as source of truth for `module.calls` ([terraform-ls#987](https://github.com/hashicorp/terraform-ls/pull/987))
 - Index uninitialized modules ([terraform-ls#997](https://github.com/hashicorp/terraform-ls/pull/997))
 - Recognize inputs and outputs of uninitialized local modules ([terraform-ls#598](https://github.com/hashicorp/terraform-ls/issues/598))
 - Enable go to module output declaration from reference ([terraform-ls#1007](https://github.com/hashicorp/terraform-ls/issues/1007))
 - New option [`indexing.ignorePaths`](https://github.com/hashicorp/terraform-ls/blob/v0.29.0/docs/SETTINGS.md#ignorepaths-string) was introduced ([terraform-ls#1003](https://github.com/hashicorp/terraform-ls/pull/1003), [terraform-ls#1010](https://github.com/hashicorp/terraform-ls/pull/1010))
 - Introduce `module.terraform` custom LSP command to expose Terraform requirements & version ([terraform-ls#1016](https://github.com/hashicorp/terraform-ls/pull/1016))
 - Avoid obtaining schema via Terraform CLI if the same version is already cached (based on plugin lock file) ([terraform-ls#1014](https://github.com/hashicorp/terraform-ls/pull/1014))
 - Complete module source and version attributes for local and registry modules ([#1024](https://github.com/hashicorp/terraform-ls/pull/1024))

BUG FIXES:

 - Ensure extension is installed in remote contexts automatically ([#1163](https://github.com/hashicorp/vscode-terraform/pull/1163))
 - Return partially parsed metadata from `module.providers` ([terraform-ls#951](https://github.com/hashicorp/terraform-ls/pull/951))
 - Avoid ignoring hidden `*.tfvars` files ([terraform-ls#968](https://github.com/hashicorp/terraform-ls/pull/968))
 - Avoid crash on invalid URIs ([terraform-ls#969](https://github.com/hashicorp/terraform-ls/pull/969))
 - Avoid crash on invalid provider name ([terraform-ls#1030](https://github.com/hashicorp/terraform-ls/pull/1030))

INTERNAL:

 - Refactor Terraform Execution API [#1185](https://github.com/hashicorp/vscode-terraform/pull/1185))
 - Bump @hashicorp/js-releases from 1.5.1 to 1.6.0 ([#1144](https://github.com/hashicorp/vscode-terraform/pull/1144))
 - indexer: refactor & improve/cleanup error handling ([terraform-ls#988](https://github.com/hashicorp/terraform-ls/pull/988))
 - indexer/walker: Avoid running jobs where not needed ([terraform-ls#1006](https://github.com/hashicorp/terraform-ls/pull/1006))
 - job: introduce explicit priority for jobs ([terraform-ls#977](https://github.com/hashicorp/terraform-ls/pull/977))

## [2.23.0] (2022-06-09)

NOTES:

 - Remove `terraform.languageServer.maxNumberOfProblems`. This setting is not used by the extension as of v2.0.0. ([#1062](https://github.com/hashicorp/vscode-terraform/pull/1062))

ENHANCEMENTS:

 - Link to documentation from module source for Registry modules ([#673](https://github.com/hashicorp/vscode-terraform/issues/673) / [terraform-ls#874](https://github.com/hashicorp/terraform-ls/pull/874))
 - Improve performance by reducing amount of notifications sent for any single module changes ([terraform-ls#931](https://github.com/hashicorp/terraform-ls/pull/931))
 - Automatically refresh Providers view when providers change in open document ([#1084](https://github.com/hashicorp/vscode-terraform/pull/1084)) / [terraform-ls#902](https://github.com/hashicorp/terraform-ls/pull/902))
 - Automatically refresh Module Calls view when module calls change in open document ([#1088](https://github.com/hashicorp/vscode-terraform/pull/1088) / [terraform-ls#909](https://github.com/hashicorp/terraform-ls/pull/909))
 - Add Module Providers view refresh button ([#1065](https://github.com/hashicorp/vscode-terraform/pull/1065))
 - Use theme-universal icon with solid background ([#1119](https://github.com/hashicorp/vscode-terraform/pull/1119))
 - Watch `**/*.tf` & `**/*.tfvars` by default such that changes outside the editor (e.g. when changing git branch) can be reflected ([#1095](https://github.com/hashicorp/vscode-terraform/pull/1095) / [terraform-ls#790](https://github.com/hashicorp/terraform-ls/pull/790))

BUG FIXES:

 - Variables with no space between them break syntax highlighting ([syntax#34](https://github.com/hashicorp/syntax/pull/34))
 - Fix parsing block with dash in name ([syntax#42](https://github.com/hashicorp/syntax/pull/42))
 - Fix highlighting of `.0`, `.*` attribute access and `[*]` brackets ([syntax#44](https://github.com/hashicorp/syntax/pull/44))

INTERNAL:

 - Organize Static Features ([#1073](https://github.com/hashicorp/vscode-terraform/pull/1073))
 - Move utility functions to dedicated space ([#1074](https://github.com/hashicorp/vscode-terraform/pull/1074))
 - Remove command prefix ([#1075](https://github.com/hashicorp/vscode-terraform/pull/1075))
 - Optimize main entry point execution path ([#1079](https://github.com/hashicorp/vscode-terraform/pull/1079))
 - Extract LanguageClient from ClientHandler ([#1082](https://github.com/hashicorp/vscode-terraform/pull/1082))

## [2.22.0] (2022-04-19)

BREAKING CHANGES:

 - Remove terraform.languageServer.requiredVersion ([#1021](https://github.com/hashicorp/vscode-terraform/pull/1021))
 - Remove terraform.languageServer.trace.server ([#1048](https://github.com/hashicorp/vscode-terraform/pull/1048))

NOTES:

 - Deprecate maxNumberOfProblems ([#1010](https://github.com/hashicorp/vscode-terraform/pull/1010))
 - Deprecate terraform-ls.rootmodule and terraform-ls.excludeRootModules ([#1049](https://github.com/hashicorp/vscode-terraform/pull/1049))

ENHANCEMENTS:

 - Support custom semantic tokens & modifiers ([#958](https://github.com/hashicorp/vscode-terraform/pull/958)) / [terraform-ls#833](https://github.com/hashicorp/terraform-ls/pull/833))
 - Enable 'go to module source' for local modules ([terraform-ls#849](https://github.com/hashicorp/terraform-ls/pull/849))
 - Enable opening a single Terraform file ([terraform-ls#843](https://github.com/hashicorp/terraform-ls/pull/843))/ ([#1031](https://github.com/hashicorp/vscode-terraform/pull/1031))
 - Organize extension settings into Sections ([#1024](https://github.com/hashicorp/vscode-terraform/pull/1024))
 - Prevent preview from activating when stable is enabled ([#1032](https://github.com/hashicorp/vscode-terraform/pull/1032))

BUG FIXES:

 - Add missing descriptions to semantic token types & modifiers ([#1039](https://github.com/hashicorp/vscode-terraform/pull/1039))
 - Avoid hanging when workspace contains >50 folders ([terraform-ls#839](https://github.com/hashicorp/terraform-ls/pull/839))
 - Make loading of parent directory after lower level directories work ([terraform-ls#851](https://github.com/hashicorp/terraform-ls/pull/851))
 - Fix corrupted diffs in formatting responses ([terraform-ls#876](https://github.com/hashicorp/terraform-ls/pull/876))
 - Fix Module View for Registry modules installed by Terraform v1.1+ ([terraform-ls#872](https://github.com/hashicorp/terraform-ls/pull/872))

INTERNAL:

 - Format semantic token settings ([#1019](https://github.com/hashicorp/vscode-terraform/pull/1019))
 - Disable naming convention warning for Code Action identifier ([#1036](https://github.com/hashicorp/vscode-terraform/pull/1036))
 - Add CODEOWNERS file ([#1038](https://github.com/hashicorp/vscode-terraform/pull/1038))
 - Fix LANGUAGE_SERVER_VERSION test in preview script ([#1034](https://github.com/hashicorp/vscode-terraform/pull/1034))
 - Github Release Notes Generator file ([#1051](https://github.com/hashicorp/vscode-terraform/pull/1051))
 - Bump terraform-ls from 0.26.0 to 0.27.0 ([#1060](https://github.com/hashicorp/vscode-terraform/pull/1060))

## [2.21.0] (2022-03-21)

ENHANCEMENTS:

 - Introduce go-to-variable from `tfvars` files ([terraform-ls#727](https://github.com/hashicorp/terraform-ls/pull/727))
 - Automatically refresh semantic tokens for more reliable highlighting ([terraform-ls#630](https://github.com/hashicorp/terraform-ls/pull/630))
 - Enhance semantic highlighting of block labels ([terraform-ls#802](https://github.com/hashicorp/terraform-ls/pull/802))
 - Enable completion, hover, go-to-definition/reference etc. for Terraform Registry modules ([terraform-ls#808](https://github.com/hashicorp/terraform-ls/pull/808))
 - Report dependent semantic highlighting modifiers as `defaultLibrary` (instead of `modification`) ([terraform-ls#817](https://github.com/hashicorp/terraform-ls/pull/817))
 - Semantically highlight type declarations in variable `type` ([terraform-ls#827](https://github.com/hashicorp/terraform-ls/pull/827))
 - Decouple highlighting Terraform grammar to `hashicorp/syntax` [`v0.1.0`](https://github.com/hashicorp/syntax/releases/tag/v0.1.0) & [`v0.2.0`](https://github.com/hashicorp/syntax/releases/tag/v0.2.0) ([#1004](https://github.com/hashicorp/vscode-terraform/pull/1004))

BUG FIXES:

 - Address race conditions typically surfaced as "out of range" errors, lack of completion/hover/etc. data or data associated with wrong position within the document ([terraform-ls#782](https://github.com/hashicorp/terraform-ls/pull/782))
 - Fix broken validate on save ([terraform-ls#799](https://github.com/hashicorp/terraform-ls/pull/799))
 - Fix encoding of unknown semantic token types ([terraform-ls#815](https://github.com/hashicorp/terraform-ls/pull/815))
 - Fix missing references for some blocks in a separate config file ([terraform-ls#829](https://github.com/hashicorp/terraform-ls/pull/829))

INTERNAL:

 - Bump terraform-ls to [`v0.26.0`](https://github.com/hashicorp/terraform-ls/releases/tag/v0.26.0) ([#1002](https://github.com/hashicorp/vscode-terraform/pull/1002))
 - Bump @hashicorp/js-releases from 1.4.0 to 1.5.1 ([#1001](https://github.com/hashicorp/vscode-terraform/pull/1001))
 - Bump @vscode/extension-telemetry from 0.4.9 to 0.4.10 ([#1003](https://github.com/hashicorp/vscode-terraform/pull/1003))

## [2.20.1] (2022-03-17)

BUG FIXES:

 - Advertise proper execution location [#989](https://github.com/hashicorp/vscode-terraform/pull/989)

INTERNAL:

 - deps: Bump jest from 27.4.7 to 27.5.1 [#951](https://github.com/hashicorp/vscode-terraform/pull/951)
 - deps: Bump @types/node from 16.11.22 to 16.11.26 [#948](https://github.com/hashicorp/vscode-terraform/pull/948)
 - deps: Bump eslint-config-prettier from 8.3.0 to 8.5.0 [#957](https://github.com/hashicorp/vscode-terraform/pull/957)
 - deps: Bump esbuild from 0.14.17 to 0.14.25 [#967](https://github.com/hashicorp/vscode-terraform/pull/967)
 - deps: Bump @types/jest from 27.4.0 to 27.4.1 [#970](https://github.com/hashicorp/vscode-terraform/pull/970)
 - deps: Bump mocha from 9.2.0 to 9.2.1 [#969](https://github.com/hashicorp/vscode-terraform/pull/969)
 - deps: Bump @typescript-eslint/parser from 5.10.2 to 5.13.0 [#971](https://github.com/hashicorp/vscode-terraform/pull/971)
 - deps: Bump @vscode/test-electron from 2.1.1 to 2.1.2 [#972](https://github.com/hashicorp/vscode-terraform/pull/972)
 - deps: Bump vsce from 2.6.6 to 2.6.7 [#976](https://github.com/hashicorp/vscode-terraform/pull/976)
 - deps: Bump @types/vscode from 1.63.2 to 1.65.0 [#959](https://github.com/hashicorp/vscode-terraform/pull/959)
 - deps: Bump @typescript-eslint/eslint-plugin from 5.10.2 to 5.13.0 [#977](https://github.com/hashicorp/vscode-terraform/pull/977)
 - deps: Bump ts-node from 10.4.0 to 10.7.0 [#981](https://github.com/hashicorp/vscode-terraform/pull/981)
 - deps: Bump eslint from 8.8.0 to 8.10.0 [#974](https://github.com/hashicorp/vscode-terraform/pull/974)
 - deps: Bump @vscode/test-electron from 2.1.2 to 2.1.3 [#984](https://github.com/hashicorp/vscode-terraform/pull/984)
 - deps: Bump typescript from 4.5.5 to 4.6.2 [#973](https://github.com/hashicorp/vscode-terraform/pull/973)
 - deps: Bump @typescript-eslint/eslint-plugin from 5.13.0 to 5.14.0 [#986](https://github.com/hashicorp/vscode-terraform/pull/986)
 - deps: Bump @typescript-eslint/parser from 5.13.0 to 5.14.0 [#985](https://github.com/hashicorp/vscode-terraform/pull/985)
 - deps: Bump eslint from 8.10.0 to 8.11.0 [#991](https://github.com/hashicorp/vscode-terraform/pull/991)
 - deps: Bump vsce from 2.6.7 to 2.7.0 [#992](https://github.com/hashicorp/vscode-terraform/pull/992)
 - deps: Bump mocha from 9.2.1 to 9.2.2 [#993](https://github.com/hashicorp/vscode-terraform/pull/993)
 - deps: Bump esbuild from 0.14.25 to 0.14.27 [#995](https://github.com/hashicorp/vscode-terraform/pull/995)
 - deps: Bump @typescript-eslint/eslint-plugin from 5.14.0 to 5.15.0 [#994](https://github.com/hashicorp/vscode-terraform/pull/994)
 - deps: Bump @typescript-eslint/parser from 5.14.0 to 5.15.0 [#996](https://github.com/hashicorp/vscode-terraform/pull/996)

## [2.20.0] (2022-03-01)

ENHANCEMENTS:

 - Publish Platform Specific Extension [#905](https://github.com/hashicorp/vscode-terraform/pull/905)
 - Update list/map syntax highlighting [#918](https://github.com/hashicorp/vscode-terraform/pull/918)
 - Improve comment detection [#935](https://github.com/hashicorp/vscode-terraform/pull/935)
 - Highlight block label as "enumMember" & highlight unquoted labels [#943](https://github.com/hashicorp/vscode-terraform/pull/943)
 - Add new scope for block type and name [#934](https://github.com/hashicorp/vscode-terraform/pull/934)
 - Resolve issue with tfvars comment toggling [#937](https://github.com/hashicorp/vscode-terraform/pull/937)
 - Improve Extension Documentation [#942](https://github.com/hashicorp/vscode-terraform/pull/942)

BUG FIXES:

 - Fix Nested Map Highlighting [#925](https://github.com/hashicorp/vscode-terraform/pull/925)
 - Fix npm run syntax tests [#928](https://github.com/hashicorp/vscode-terraform/pull/928)
 - Move TextMate scope.terraform to source.terraform [#921](https://github.com/hashicorp/vscode-terraform/pull/921)
 - Fix highlighting for attribute access with a dash [#933](https://github.com/hashicorp/vscode-terraform/pull/933)
 - Fix highlighting for nested expression syntax [#940](https://github.com/hashicorp/vscode-terraform/pull/940)
 - Update description for log file argument [#945](https://github.com/hashicorp/vscode-terraform/pull/945)
 
INTERNAL:

 - deps: Update vsce, mocha, and node-fetch [#908](https://github.com/hashicorp/vscode-terraform/pull/908)
 - deps: Update vsce to 2.6.6 [#916](https://github.com/hashicorp/vscode-terraform/pull/916)
 - Fix preview publish trigger [#910](https://github.com/hashicorp/vscode-terraform/pull/910)
 - Manual Preview release workflow dispatch [#911](https://github.com/hashicorp/vscode-terraform/pull/911)
 - Terraform TextMate Test Infrastructure [#912](https://github.com/hashicorp/vscode-terraform/pull/912)
 - Add Terraform language tmgrammar snapshots [#914](https://github.com/hashicorp/vscode-terraform/pull/914)
 - Run syntax tests on all snapshot files [#917](https://github.com/hashicorp/vscode-terraform/pull/917)
 - Run syntax tests when grammar changes [#922](https://github.com/hashicorp/vscode-terraform/pull/922)
 - deps: Update to @vscode/extension-telemetry [#939](https://github.com/hashicorp/vscode-terraform/pull/)
 - Fix ignore markdown files [#946](https://github.com/hashicorp/vscode-terraform/pull/946)

## [2.19.0] (2022-01-20)

NOTES:

 - Deprecate terraform.languageServer.requiredVersion [#903](https://github.com/hashicorp/vscode-terraform/pull/903)

ENHANCEMENTS:

 - Update telemetry configuration documentation [#894](https://github.com/hashicorp/vscode-terraform/pull/894)

INTERNAL:

 - deps: Update to Node 16 and VS Code 1.61 [#904](https://github.com/hashicorp/vscode-terraform/pull/904)
 - deps: Bump @vscode/test-electron from 2.0.1 to 2.0.3 [#899](https://github.com/hashicorp/vscode-terraform/pull/899)
 - deps: Bump jest from 27.4.6 to 27.4.7 [#892](https://github.com/hashicorp/vscode-terraform/pull/892)
 - deps: Update actions/setup-node to v2 [#897](https://github.com/hashicorp/vscode-terraform/pull/897)
 - deps: Update eslint and minimal ruleset [#896](https://github.com/hashicorp/vscode-terraform/pull/896)
 - Test VS Code Version Matrix [#886](https://github.com/hashicorp/vscode-terraform/pull/886)
 - Ignore jest config when packaging [#895](https://github.com/hashicorp/vscode-terraform/pull/895)

## [2.18.0] (2022-01-07)

ENHANCEMENTS:

 - Improve language server installation ([#868](https://github.com/hashicorp/vscode-terraform/pull/868))
 - Make reference count code lens opt-in (disabled by default) ([#893](https://github.com/hashicorp/vscode-terraform/pull/893))

BUG FIXES:

 - Fix Terraform file detection ([#870](https://github.com/hashicorp/vscode-terraform/pull/870))

INTERNAL:

 - deps: bump vscode-extension-telemetry to 0.4.4 ([#884](https://github.com/hashicorp/vscode-terraform/pull/884))

## [2.17.0] (2021-12-02)

ENHANCEMENTS:

 - Add new setting which toggles displaying reference counts above top level blocks and attributes ([#837](https://github.com/hashicorp/vscode-terraform/pull/837))
 - Add support for language server side config option `ignoreDirectoryNames` ([#833](https://github.com/hashicorp/vscode-terraform/pull/833))
 - Add module providers view to Explorer pane ([#850](https://github.com/hashicorp/vscode-terraform/pull/850))
 - Process telemetry from the language server ([#823](https://github.com/hashicorp/vscode-terraform/pull/823))
 - Add a new command for generating bug reports ([#851](https://github.com/hashicorp/vscode-terraform/pull/851))

BUG FIXES:

 - Fix Terraform status bar not being displayed ([#857](https://github.com/hashicorp/vscode-terraform/pull/857))

INTERNAL:

 - Refactor extension to only use one LanguageClient per workspace ([#845](https://github.com/hashicorp/vscode-terraform/pull/845))
 - Stop exposing a public extension API ([#858](https://github.com/hashicorp/vscode-terraform/pull/858))
 - deps: bump vscode-extension-telemetry to 0.4.3 ([#846](https://github.com/hashicorp/vscode-terraform/pull/846))

## [2.16.0] (2021-10-14)

ENHANCEMENTS:

 - Add module calls view to Explorer pane ([#746](https://github.com/hashicorp/vscode-terraform/pulls/746))
 - Add experimental `prefillRequiredFields` feature ([#799](https://github.com/hashicorp/vscode-terraform/pulls/799))
 - Install LS into dedicated persistent global storage (to avoid the need for LS reinstallation upon extension upgrade) ([#811](https://github.com/hashicorp/vscode-terraform/pulls/811))

INTERNAL:

 - deps: bump vscode-extension-telemetry to 0.4.2 ([#790](https://github.com/hashicorp/vscode-terraform/pulls/790))

## [2.15.0] (2021-09-22)

ENHANCEMENTS:

 - Add support for language server side config option `terraformExecPath` ([#741](https://github.com/hashicorp/vscode-terraform/pulls/741))
 - Add support for language server side config option `terraformExecTimeout` ([#741](https://github.com/hashicorp/vscode-terraform/pulls/741))
 - Add support for language server side config option `terraformLogFilePath` ([#741](https://github.com/hashicorp/vscode-terraform/pulls/741))

BUG FIXES:

 - fix: avoid tracking client which is not ready yet ([#778](https://github.com/hashicorp/vscode-terraform/pulls/778))
 - fix: avoid considering output panes as editors ([#771](https://github.com/hashicorp/vscode-terraform/pulls/771))

## [2.14.0] (2021-07-22)

FEATURES:

 - Register command to show references ([#686](https://github.com/hashicorp/vscode-terraform/pulls/686))

ENHANCEMENTS:

 - Install native LS build for Apple Silicon (darwin/arm64) ([#563](https://github.com/hashicorp/vscode-terraform/pulls/563))
 - Add semver based version pin for Language Server via `requiredVersion` config option ([#656](https://github.com/hashicorp/vscode-terraform/pulls/656))
 - Improve error handling ([#691](https://github.com/hashicorp/vscode-terraform/pulls/691))

BUG FIXES:

 - fix: launch LS even if path contains escapable characters ([#694](https://github.com/hashicorp/vscode-terraform/pulls/694))

## [2.13.2] (2021-07-19)

BUG FIXES:

 - Fix language server update logic ([#690](https://github.com/hashicorp/vscode-terraform/pulls/690))

## [2.13.1] (2021-07-16)

BUG FIXES:

 - Fix DocumentSelector for multi-folder workspace ([#688](https://github.com/hashicorp/vscode-terraform/pulls/688))

## [2.13.0] (2021-06-23)

FEATURES:

 - Add support for Terraform variable files (`tfvars`) ([#661](https://github.com/hashicorp/vscode-terraform/pulls/661))

## [2.12.1] (2021-06-11)

BUG FIXES:

 - Avoid duplicate language clients for non-multi-folder setup ([#663](https://github.com/hashicorp/vscode-terraform/pulls/663))

## [2.12.0] (2021-06-08)

BUG FIXES:

 - Avoid launching more servers if server supports multiple folders ([#654](https://github.com/hashicorp/vscode-terraform/pulls/654))

INTERNAL:

 - Rename `rootModules` command to `module.callers` ([#633](https://github.com/hashicorp/vscode-terraform/pulls/633))

## [2.11.0] (2021-05-18)

BUG FIXES:

* Reorder functions to prioritize abspath highlight ([#630](https://github.com/hashicorp/vscode-terraform/pulls/630))
* Only trigger language server auto update once ([#623](https://github.com/hashicorp/vscode-terraform/pulls/623))

## [2.10.2] (2021-05-03)

BUG FIXES:

* Correct delay for language server version check ([#620](https://github.com/hashicorp/vscode-terraform/pulls/620))

## [2.10.1] (2021-04-28)

BUG FIXES:

* Update js-releases dependency to resolve security issue [HCSEC-2021-12](https://discuss.hashicorp.com/t/hcsec-2021-12-codecov-security-event-and-hashicorp-gpg-key-exposure/23512) ([#612](https://github.com/hashicorp/vscode-terraform/pulls/612))

## [2.10.0] (2021-04-13)

ENHANCEMENTS:

* Update syntax highlighting for Terraform 0.15 ([#604](https://github.com/hashicorp/vscode-terraform/pulls/604))

## [2.9.1] (2021-03-24)

BUG FIXES:

* Fix contents of vsix package

## [2.9.0] (2021-03-24)

ENHANCEMENTS:

* Check for language server updates every 24 hours ([#595](https://github.com/hashicorp/vscode-terraform/pulls/595))

BUG FIXES:

* Normalize language server installer file paths ([#589](https://github.com/hashicorp/vscode-terraform/pulls/589))
* Disable statusbar feature if a custom language server is in use ([#593](https://github.com/hashicorp/vscode-terraform/pulls/593))

## [2.8.3] (2021-03-16)

ENHANCEMENTS:

* Update client telemetry ([#587](https://github.com/hashicorp/vscode-terraform/pulls/587))

## [2.8.2] (2021-03-11)

ENHANCEMENTS:

* Change telemetry value for the language server version to make it easier to filter ([#582](https://github.com/hashicorp/vscode-terraform/pulls/582))

BUG FIXES:

* Match correct language server binary name per platform – fixes language server upgrade problems on Windows ([#583](https://github.com/hashicorp/vscode-terraform/pulls/583))
* Rescue version check errors on language server install ([#584](https://github.com/hashicorp/vscode-terraform/pulls/584))

## [2.8.1] (2021-03-10)

BUG FIXES:

* Improve error message for failed language server install ([#580](https://github.com/hashicorp/vscode-terraform/pulls/580))
* Add telemetry for tracking language server installed and upgrade versions ([#579](https://github.com/hashicorp/vscode-terraform/pulls/579))

## [2.8.0] (2021-03-09)

ENHANCEMENTS:

* Add stopClient and execWorkspaceCommand telemetry events ([#577](https://github.com/hashicorp/vscode-terraform/pulls/577))

BUG FIXES:

* Cancel language server install when upgrade message is closed ([#570](https://github.com/hashicorp/vscode-terraform/pulls/570))

## [2.7.0] (2021-02-22)

ENHANCEMENTS:

* Add telemetry for error reporting ([#557](https://github.com/hashicorp/vscode-terraform/pulls/557))
* Use version JSON output of LS during installation ([#560](https://github.com/hashicorp/vscode-terraform/pulls/560))

## [2.6.0] (2021-02-09)

FEATURES:

* Execute terraform plan and apply using the VSCode terminal ([#551](https://github.com/hashicorp/vscode-terraform/pulls/551))

## [2.5.0] (2021-01-14)

FEATURES:

* Add setting for experimental features to enable validateOnSave ([#536](https://github.com/hashicorp/vscode-terraform/pulls/536))
* Add terraform validate command ([#540](https://github.com/hashicorp/vscode-terraform/pulls/540))

## [2.4.0] (2021-01-07)

FEATURES:

* Use amd64 binary to support Apple Silicon Macs ([#527](https://github.com/hashicorp/vscode-terraform/pulls/527))
* Add command and statusbar interface for running terraform init ([#495](https://github.com/hashicorp/vscode-terraform/pulls/495))

ENHANCEMENTS:

* Read LS version from stdout ([#512](https://github.com/hashicorp/vscode-terraform/pulls/512))
* Prepare for semantic token based highlighting ([#523](https://github.com/hashicorp/vscode-terraform/pulls/523))

## [2.3.0] (2020-11-12)

NOTES:

* Set up integration tests in GitHub actions ([#483](https://github.com/hashicorp/vscode-terraform/pulls/483))

BUG FIXES:

* Fix 32bit downloads of language server ([#483](https://github.com/hashicorp/vscode-terraform/pulls/483))
* Prune nested workspace folders to prevent running multiple language servers for the same directory ([#499](https://github.com/hashicorp/vscode-terraform/pulls/499))
* Prefix workspace command names to prevent multi-instance name collisions ([#514](https://github.com/hashicorp/vscode-terraform/pulls/514))

## [2.2.3] (2020-09-03)

BUG FIXES:

* Update object syntax highlighting to fix unmatched cases ([#485](https://github.com/hashicorp/vscode-terraform/pulls/485))

## [2.2.2] (2020-08-25)

BUG FIXES:

* Fix additional object key matching issues ([#478](https://github.com/hashicorp/vscode-terraform/pulls/478))

## [2.2.1] (2020-08-24)

BUG FIXES:

* Fix object key syntax highlighting ([#475](https://github.com/hashicorp/vscode-terraform/pulls/475))

## [2.2.0] (2020-08-20)

ENHANCEMENTS:

* Perform PGP verification of zip/shasums ([#450](https://github.com/hashicorp/vscode-terraform/pulls/450))
* Upgrade LS client library to major version 6 ([#454](https://github.com/hashicorp/vscode-terraform/pulls/454))
* Add multi-folder workspace support ([#448](https://github.com/hashicorp/vscode-terraform/pulls/448))
* Ensure downloaded zips are deleted ([#464](https://github.com/hashicorp/vscode-terraform/pulls/464))
* Add configuration to exclude root modules ([#446](https://github.com/hashicorp/vscode-terraform/pulls/446))

BUG FIXES:

* Refactor and fix install bugs ([#444](https://github.com/hashicorp/vscode-terraform/pulls/444))
* Fix block syntax labels ([#458](https://github.com/hashicorp/vscode-terraform/pulls/458))
* Fix parenthesis syntax error ([#459](https://github.com/hashicorp/vscode-terraform/pulls/459))
* Fix syntax highlighting for object expressions ([#462](https://github.com/hashicorp/vscode-terraform/pulls/462))

## [2.1.1] (2020-07-15)

BUG FIXES:

* Fix race in shasum verification ([#438](https://github.com/hashicorp/vscode-terraform/pulls/438))

## [2.1.0] (2020-07-14)

ENHANCEMENTS:

* Verify shasum of language server binary on install ([#414](https://github.com/hashicorp/vscode-terraform/pulls/414))
* Add link to language server changelog on completed install ([#424](https://github.com/hashicorp/vscode-terraform/pulls/424))
* Add syntax for object and tuple structural types ([#428](https://github.com/hashicorp/vscode-terraform/pulls/428))
* Add setting for workspace root module configuration ([#423](https://github.com/hashicorp/vscode-terraform/pulls/423))

## [2.0.2] (2020-06-23)

BUG FIXES:

* Hide language server output window to prevent stealing focus ([#408](https://github.com/hashicorp/vscode-terraform/pulls/408))

## [2.0.1] (2020-06-10)

BUG FIXES:

Fix for Marketplace listing issue

## [2.0.0] (2020-06-10)

The Terraform VSCode extension has [a new home at HashiCorp](https://www.hashicorp.com/blog/supporting-the-hashicorp-terraform-extension-for-visual-studio-code/)! We're integrating with a [new language server](https://github.com/hashicorp/terraform-ls) designed to create a stable integration with Terraform through public APIs. When you upgrade to v2.0.0, the new language server will be installed by default, and checking for updates automatically.

Two commands have been added to manage the language server manually, which you can access via the [Command Palette](https://code.visualstudio.com/docs/getstarted/userinterface#_command-palette): "Terraform: Enable Language Server" and "Terraform: Disable Language Server".

If you want to use a custom-built language server, it can be enabled with the Terraform extension setting "terraform.languageServer.pathToBinary". Include the full path and binary name.

In this version, we've updated the syntax highlighting to work under Terraform 0.12. Errors that were seen in trying to read 0.12 files have also been eliminated. Highlighting and other core features will be partially compatible under 0.11 as well but continuing development will only focus on 0.12 and future versions. If you work in 0.11, you should [pin your extension to an earlier version](https://code.visualstudio.com/updates/v1_30#_install-previous-versions).

Other updates:

* Full-document formatting is provided through the language server and [can be configured](https://code.visualstudio.com/docs/editor/codebasics#_formatting) through user or workspace settings
* Added shortcuts (snippets) for variable and for_each syntax -- `fore`, `vare`, `varm`
* For contributors, the TypeScript testing and linting frameworks have been brought current with the recommended packages
* Logos now match the current brand guidelines (pretty snazzy!)
* Auto-completion, hover, and definition features are now managed by the language server, so see their [changelog](https://github.com/hashicorp/terraform-ls/blob/main/CHANGELOG.md) for the most recent updates
* External commands such as `terraform validate` and `tflint` are removed from the extension, but we plan to add hooks for these and/or additional integrations via the language server.
* The outline view and model overview have been removed for now in order to focus on core features

### Previous Releases

For information on prior major and minor releases, see their changelogs:

* [v1.4.0 and earlier](https://github.com/hashicorp/vscode-terraform/blob/v1.4.0/CHANGELOG.md#140)
* [v0.0.23 and earlier](https://github.com/hashicorp/vscode-terraform/blob/0.0.23/CHANGELOG.md#0.0.23)


<!-- Links to tag comparisons -->
[Unreleased]: https://github.com/hashicorp/vscode-terraform/compare/v2.25.2...main
[2.25.2]: https://github.com/hashicorp/vscode-terraform/compare/v2.25.1...v2.25.2
[2.25.1]: https://github.com/hashicorp/vscode-terraform/compare/v2.25.0...v2.25.1
[2.25.0]: https://github.com/hashicorp/vscode-terraform/compare/v2.24.3...v2.25.0
[2.24.3]: https://github.com/hashicorp/vscode-terraform/compare/v2.24.2...v2.24.3
[2.24.2]: https://github.com/hashicorp/vscode-terraform/compare/v2.24.1...v2.24.2
[2.24.1]: https://github.com/hashicorp/vscode-terraform/compare/v2.24.0...v2.24.1
[2.24.0]: https://github.com/hashicorp/vscode-terraform/compare/v2.23.0...v2.24.0
[2.23.0]: https://github.com/hashicorp/vscode-terraform/compare/v2.22.0...v2.23.0
[2.22.0]: https://github.com/hashicorp/vscode-terraform/compare/v2.21.0...v2.22.0
[2.21.0]: https://github.com/hashicorp/vscode-terraform/compare/v2.20.1...v2.21.0
[2.20.1]: https://github.com/hashicorp/vscode-terraform/compare/v2.20.0...v2.20.1
[2.20.0]: https://github.com/hashicorp/vscode-terraform/compare/v2.19.0...v2.20.0
[2.19.0]: https://github.com/hashicorp/vscode-terraform/compare/v2.18.0...v2.19.0
[2.18.0]: https://github.com/hashicorp/vscode-terraform/compare/v2.17.0...v2.18.0
[2.17.0]: https://github.com/hashicorp/vscode-terraform/compare/v2.16.0...v2.17.0
[2.16.0]: https://github.com/hashicorp/vscode-terraform/compare/v2.15.0...v2.16.0
[2.15.0]: https://github.com/hashicorp/vscode-terraform/compare/v2.14.0...v2.15.0
[2.14.0]: https://github.com/hashicorp/vscode-terraform/compare/v2.13.2...v2.14.0
[2.13.2]: https://github.com/hashicorp/vscode-terraform/compare/v2.13.1...v2.13.2
[2.13.1]: https://github.com/hashicorp/vscode-terraform/compare/v2.13.0...v2.13.1
[2.13.0]: https://github.com/hashicorp/vscode-terraform/compare/v2.12.1...v2.13.0
[2.12.1]: https://github.com/hashicorp/vscode-terraform/compare/v2.12.0...v2.12.1
[2.12.0]: https://github.com/hashicorp/vscode-terraform/compare/v2.11.0...v2.12.0
[2.11.0]: https://github.com/hashicorp/vscode-terraform/compare/v2.10.2...v2.11.0
[2.10.2]: https://github.com/hashicorp/vscode-terraform/compare/v2.10.1...v2.10.2
[2.10.1]: https://github.com/hashicorp/vscode-terraform/compare/v2.10.0...v2.10.1
[2.10.0]: https://github.com/hashicorp/vscode-terraform/compare/v2.9.1...v2.10.0
[2.9.1]: https://github.com/hashicorp/vscode-terraform/compare/v2.9.0...v2.9.1
[2.9.0]: https://github.com/hashicorp/vscode-terraform/compare/v2.8.3...v2.9.0
[2.8.3]: https://github.com/hashicorp/vscode-terraform/compare/v2.8.2...v2.8.3
[2.8.2]: https://github.com/hashicorp/vscode-terraform/compare/v2.8.1...v2.8.2
[2.8.1]: https://github.com/hashicorp/vscode-terraform/compare/v2.8.0...v2.8.1
[2.8.0]: https://github.com/hashicorp/vscode-terraform/compare/v2.7.0...v2.8.0
[2.7.0]: https://github.com/hashicorp/vscode-terraform/compare/v2.6.0...v2.7.0
[2.6.0]: https://github.com/hashicorp/vscode-terraform/compare/v2.5.0...v2.6.0
[2.5.0]: https://github.com/hashicorp/vscode-terraform/compare/v2.4.0...v2.5.0
[2.4.0]: https://github.com/hashicorp/vscode-terraform/compare/v2.3.0...v2.4.0
[2.3.0]: https://github.com/hashicorp/vscode-terraform/compare/v2.2.3...v2.3.0
[2.2.3]: https://github.com/hashicorp/vscode-terraform/compare/v2.2.2...v2.2.3
[2.2.2]: https://github.com/hashicorp/vscode-terraform/compare/v2.2.1...v2.2.2
[2.2.1]: https://github.com/hashicorp/vscode-terraform/compare/v2.2.0...v2.2.1
[2.2.0]: https://github.com/hashicorp/vscode-terraform/compare/v2.1.1...v2.2.0
[2.1.1]: https://github.com/hashicorp/vscode-terraform/compare/v2.1.0...v2.1.1
[2.1.0]: https://github.com/hashicorp/vscode-terraform/compare/v2.0.2...v2.1.0
[2.0.2]: https://github.com/hashicorp/vscode-terraform/compare/v2.0.1...v2.0.2
[2.0.1]: https://github.com/hashicorp/vscode-terraform/compare/v2.0.0...v2.0.1
[2.0.0]: https://github.com/hashicorp/vscode-terraform/compare/v1.4.0...v2.0.0
