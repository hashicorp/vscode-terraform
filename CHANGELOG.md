# Changelog

## 2.34.3 (2025-01-22)

ENHANCEMENTS:

* Report usage of write-only attributes for public providers ([terraform-ls#1926](https://github.com/hashicorp/terraform-ls/issues/1926))

## 2.34.2 (2024-12-19)

BUG FIXES:

* Fix race when parsing locally installed module sources leading to empty completions ([#1903](https://github.com/hashicorp/terraform-ls/issues/1903))

INTERNAL:

* Enable code coverage reporting ([#1901](https://github.com/hashicorp/vscode-terraform/issues/1901))
* Fix flaky ui tests by increasing sleep time ([#1925](https://github.com/hashicorp/vscode-terraform/issues/1925))

## 2.34.2024121211 (2024-12-12)

NOTES

This brings the prerelease channel to the same version as stable

## 2.34.1 (2024-12-12)

ENHANCEMENTS:

* Reflect lifecycle phases of ephemeral resources in HCP Terraform log messages ([#1882](https://github.com/hashicorp/vscode-terraform/issues/1882))
* Stacks: parse terraform-sources.json to support remote component sources ([terraform-ls#1836](https://github.com/hashicorp/terraform-ls/issues/1836))

BUG FIXES:

* Fix HCP workspace link ([#1889](https://github.com/hashicorp/vscode-terraform/issues/1889))
* Fix new issue link in README ([#1890](https://github.com/hashicorp/vscode-terraform/issues/1890))
* Fix incorrect validation for heterogeneous list ([terraform-ls#1884](https://github.com/hashicorp/terraform-ls/issues/1884))
* Fix incorrect validation of references by correctly detecting tuple and object expressions created from for-expressions ([terraform-ls#1890](https://github.com/hashicorp/terraform-ls/issues/1890))

INTERNAL:

* Port UI tests to vscode-extension-tester and remove wdio ([#1873](https://github.com/hashicorp/vscode-terraform/issues/1873))
* Add Heimdall metadata ([#1883](https://github.com/hashicorp/vscode-terraform/issues/1883))
* Add build files to .vscodeignore ([#1885](https://github.com/hashicorp/vscode-terraform/issues/1885))
* Broaden npm version to allow dependabot to run ([#1888](https://github.com/hashicorp/vscode-terraform/issues/1888))
* Store screenshots for failing UI tests ([#1906](https://github.com/hashicorp/vscode-terraform/issues/1906))
* Adapt CI config for Ubuntu 24.04.1 ([#1907](https://github.com/hashicorp/vscode-terraform/issues/1907))
* Configure dependabot to update package.json and group dependency updates ([#1908](https://github.com/hashicorp/vscode-terraform/issues/1908))

## 2.34.0 (2024-11-15)

ENHANCEMENTS:

* Add `category` to Stacks Deployment store blocks  ([terraform-ls#1852](https://github.com/hashicorp/terraform-ls/issues/1852))
* Support terraform.applying built-in reference starting at TF 1.10 ([terraform-ls#1854](https://github.com/hashicorp/terraform-ls/issues/1854))
* Raise HCL Diagnostics during early validation ([terraform-ls#1850](https://github.com/hashicorp/terraform-ls/issues/1850))
* backend/s3: Reflect use_lockfile (v1.10) ([terraform-schema#419](https://github.com/hashicorp/terraform-schema/issues/419))
* backend/s3: Remove deprecated assume role attributes (v1.10) ([terraform-schema#420](https://github.com/hashicorp/terraform-schema/issues/420))

BUG FIXES:

* Improve performance by avoiding copying constraints for attribute schemas ([hcl-lang#426](https://github.com/hashicorp/hcl-lang/issues/426))
* Use a provider's stable version when bundling schemas ([terraform-ls#1860](https://github.com/hashicorp/terraform-ls/issues/1860))
* Add `removed` block to Stack tests ([#1861](https://github.com/hashicorp/vscode-terraform/issues/1861))

INTERNAL:

* Ensure date ordering for changie entries ([#1860](https://github.com/hashicorp/vscode-terraform/issues/1860))
* Upgrade eslint to v9 ([#1863](https://github.com/hashicorp/vscode-terraform/issues/1863))
* Enable integration tests for Stacks feature ([#1864](https://github.com/hashicorp/vscode-terraform/issues/1864))
* Bump nodejs from 18 to 20 ([#1867](https://github.com/hashicorp/vscode-terraform/issues/1867))
* Remove webpack extension recommendation ([#1880](https://github.com/hashicorp/vscode-terraform/issues/1880))

## 2.34.2024101517 (2024-10-15)

NOTES:

This is a release to bring the prerelease channel to parity with stable.

This release adds support for Terraform Stack and Deployment files. This provides intelligent completion for Terraform Stacks blocks and attributes in Stack and Deployment files, including suggesting only valid completions for variables in component and deployment blocks. Hover documentation for all Stack and Deploy blocks, with helpful type and usage information. Early Validation has been extended to produce diagnostics along with syntax validation for Stack and Deployment files. Reference support allows code navigation in and between Stack and Deploy files. This also provides formatting support for both Stack and Deploy files.

This release also adds support for Terraform Test and Mock files. This provides syntax highlighting, completion for blocks and attributes, hover documentation and formatting support.

## 2.33.0 (2024-10-14)

NOTES:

This release adds support for Terraform Stack and Deployment files. This provides intelligent completion for Terraform Stacks blocks and attributes in Stack and Deployment files, including suggesting only valid completions for variables in component and deployment blocks. Hover documentation for all Stack and Deploy blocks, with helpful type and usage information. Early Validation has been extended to produce diagnostics along with syntax validation for Stack and Deployment files. Reference support allows code navigation in and between Stack and Deploy files. This also provides formatting support for both Stack and Deploy files.

This release also adds support for Terraform Test and Mock files. This provides syntax highlighting, completion for blocks and attributes, hover documentation and formatting support.

BREAKING CHANGES:

* Remove static snippets ([#1830](https://github.com/hashicorp/vscode-terraform/issues/1830))

ENHANCEMENTS:

* Add initial support for Terraform Stacks files and Deployment files ([#1745](https://github.com/hashicorp/terraform-ls/issues/1745))
* Bump hashicorp/syntax from 0.5.0 to 0.7.0 ([#1820](https://github.com/hashicorp/vscode-terraform/issues/1820))
* Document Terraform Stacks support ([#1829](https://github.com/hashicorp/vscode-terraform/issues/1829))
* Enable language status bar for Stack language ([#1835](https://github.com/hashicorp/vscode-terraform/issues/1835))
* Add icon for .terraform-version file ([#1836](https://github.com/hashicorp/vscode-terraform/issues/1836))
* Parse and load Stack and Deploy metadata ([terraform-ls#1761](https://github.com/hashicorp/terraform-ls/issues/1761))
* Load Stack component sources from metadata ([terraform-ls#1768](https://github.com/hashicorp/terraform-ls/issues/1768))
* Enable early validation for Terraform Stack files ([terraform-ls#1776](https://github.com/hashicorp/terraform-ls/issues/1776))
* Merge stack configuration schema with dynamic schema based on used components source and providers ([terraform-ls#1770](https://github.com/hashicorp/terraform-ls/issues/1770))
* Merge deployment configuration schema with dynamic schema based on available variables ([terraform-ls#1780](https://github.com/hashicorp/terraform-ls/issues/1780))
* Support Terraform functions in stack files ([terraform-ls#1781](https://github.com/hashicorp/terraform-ls/issues/1781))
* Add DecodeReferenceOrigins and DecodeReferenceTargets jobs ([terraform-ls#1786](https://github.com/hashicorp/terraform-ls/issues/1786))
* Enable component references ([terraform-schema#386](https://github.com/hashicorp/terraform-schema/issues/386))
* Support references for identity tokens and their attributes ([terraform-schema#388](https://github.com/hashicorp/terraform-schema/issues/388))
* Enable references for variables in deployment inputs (Deploy) ([terraform-schema#389](https://github.com/hashicorp/terraform-schema/issues/389))
* Enable component references ([terraform-schema#386](https://github.com/hashicorp/terraform-schema/issues/386))
* Enable ephemeral values for variable ([terraform-schema#387](https://github.com/hashicorp/terraform-schema/issues/387))
* Enable output references ([terraform-schema#384](https://github.com/hashicorp/terraform-schema/issues/384))
* Enable provider references ([terraform-schema#385](https://github.com/hashicorp/terraform-schema/issues/385))
* Add Address to variable block schema for stacks to enable references ([terraform-schema#383](https://github.com/hashicorp/terraform-schema/issues/383))
* Add deployments store block schema ([terraform-schema#382](https://github.com/hashicorp/terraform-schema/issues/382))
* Add input block schema and deprecate variable block ([terraform-schema#381](https://github.com/hashicorp/terraform-schema/issues/381))
* Validate Stack and Deployment files for unreferenced origins ([terraform-ls#1797](https://github.com/hashicorp/terraform-ls/issues/1797))
* Early decode deployment config to support references to store blocks ([terraform-schema#390](https://github.com/hashicorp/terraform-schema/issues/390))
* Support a subset of functions in deployment configurations ([terraform-ls#1799](https://github.com/hashicorp/terraform-ls/issues/1799))
* Support description attribute for orchestration rule block ([terraform-schema#393](https://github.com/hashicorp/terraform-schema/issues/393))
* Support locals in stack and deploy configs ([terraform-schema#395](https://github.com/hashicorp/terraform-schema/issues/395))
* Support depends_on attribute in component blocks ([terraform-schema#392](https://github.com/hashicorp/terraform-schema/issues/392))
* Support provider defined functions in stacks configuration ([#1804](https://github.com/hashicorp/terraform-ls/issues/1804))
* Support description attribute for orchestration rule block ([terraform-schema#393](https://github.com/hashicorp/terraform-schema/issues/393))
* Support locals in stack and deploy configs ([terraform-schema#395](https://github.com/hashicorp/terraform-schema/issues/395))
* Support depends_on attribute in component blocks ([terraform-schema#392](https://github.com/hashicorp/terraform-schema/issues/392))
* Support context references within orchestrate blocks in deployment configuration ([#1813](https://github.com/hashicorp/terraform-ls/issues/1813))
* Initial support for Terraform Test and Mock files ([#1812](https://github.com/hashicorp/vscode-terraform/issues/1812))
* Enable language status bar for Test Language ([#1847](https://github.com/hashicorp/vscode-terraform/issues/1847))
* Static schema support for Terraform Test and Mock files ([terraform-ls#1782](https://github.com/hashicorp/terraform-ls/issues/1782))

BUG FIXES:

* Update HCP Terraform readme with corrected gifs ([#1839](https://github.com/hashicorp/vscode-terraform/issues/1839))
* Fixes parsing expressions containing an open curly brace as blocks ([syntax#149](https://github.com/hashicorp/syntax/issues/149))
* Fix panic on blocks with no labels during validation of label name ([terraform-ls#1791](https://github.com/hashicorp/terraform-ls/issues/1791))
* Fix type for provider references in component blocks ([terraform-schema#391](https://github.com/hashicorp/terraform-schema/issues/391))
* Support sensitive attribute for stacks variables ([terraform-schema#401](https://github.com/hashicorp/terraform-schema/issues/401))
* Allow any type as inputs to components per default ([terraform-schema#400](https://github.com/hashicorp/terraform-schema/issues/400))

INTERNAL:

* Add development launch target for extensionHost ([#1805](https://github.com/hashicorp/vscode-terraform/issues/1805))
* Replace webpack with esbuild ([#1807](https://github.com/hashicorp/vscode-terraform/issues/1807))
* Load embedded provider schemas for providers found in stacks files into state ([terraform-ls#1763](https://github.com/hashicorp/terraform-ls/issues/1763))
* Bump axios to 1.7.4 ([#1818](https://github.com/hashicorp/vscode-terraform/issues/1818))
* Bump braces to 3.0.3 ([#1819](https://github.com/hashicorp/vscode-terraform/issues/1819))

## 2.33.2024090609 (2024-09-06)

ENHANCEMENTS:

* Bump hashicorp/syntax from 0.5.0 to 0.7.0 ([#1820](https://github.com/hashicorp/vscode-terraform/issues/1820))
* Document Terraform Stacks support ([#1829](https://github.com/hashicorp/vscode-terraform/issues/1829))
* Remove static snippets ([#1830](https://github.com/hashicorp/vscode-terraform/issues/1830))
* Enable language status bar for Stack language ([#1835](https://github.com/hashicorp/vscode-terraform/issues/1835))
* Add icon for .terraform-version file ([#1836](https://github.com/hashicorp/vscode-terraform/issues/1836))
* Support provider defined functions in stacks configuration ([#1804](https://github.com/hashicorp/terraform-ls/issues/1804))
* Support description attribute for orchestration rule block ([terraform-schema#393](https://github.com/hashicorp/terraform-schema/issues/393))
* Support locals in stack and deploy configs ([terraform-schema#395](https://github.com/hashicorp/terraform-schema/issues/395))
* Support depends_on attribute in component blocks ([terraform-schema#392](https://github.com/hashicorp/terraform-schema/issues/392))
* Document Terraform Stacks support ([#1802](https://github.com/hashicorp/terraform-ls/issues/1802))
* Support context references within orchestrate blocks in deployment configuration ([#1813](https://github.com/hashicorp/terraform-ls/issues/1813))

BUG FIXES:

* Fix type for provider references in component blocks ([terraform-schema#391](https://github.com/hashicorp/terraform-schema/issues/391))
* Support sensitive attribute for stacks variables ([terraform-schema#401](https://github.com/hashicorp/terraform-schema/issues/401))
* Allow any type as inputs to components per default ([terraform-schema#400](https://github.com/hashicorp/terraform-schema/issues/400))

INTERNAL:

* Bump axios to 1.7.4 ([#1818](https://github.com/hashicorp/vscode-terraform/issues/1818))
* Bump braces to 3.0.3 ([#1819](https://github.com/hashicorp/vscode-terraform/issues/1819))

## 2.33.2024082314 (2024-08-23)

ENHANCEMENTS:

* Enable component references ([terraform-schema#386](https://github.com/hashicorp/terraform-schema/issues/386))
* Support references for identity tokens and their attributes ([terraform-schema#388](https://github.com/hashicorp/terraform-schema/issues/388))
* Enable references for variables in deployment inputs (Deploy) ([terraform-schema#389](https://github.com/hashicorp/terraform-schema/issues/389))
* Enable component references ([terraform-schema#386](https://github.com/hashicorp/terraform-schema/issues/386))
* Enable ephemeral values for variable ([terraform-schema#387](https://github.com/hashicorp/terraform-schema/issues/387))
* Enable output references ([terraform-schema#384](https://github.com/hashicorp/terraform-schema/issues/384))
* Enable provider references ([terraform-schema#385](https://github.com/hashicorp/terraform-schema/issues/385))
* Add Address to variable block schema for stacks to enable references ([terraform-schema#383](https://github.com/hashicorp/terraform-schema/issues/383))
* Add deployments store block schema ([terraform-schema#382](https://github.com/hashicorp/terraform-schema/issues/382))
* Add input block schema and deprecate variable block ([terraform-schema#381](https://github.com/hashicorp/terraform-schema/issues/381))
* Validate Stack and Deployment files for unreferenced origins ([terraform-ls#1797](https://github.com/hashicorp/terraform-ls/issues/1797))
* Early decode deployment config to support references to store blocks ([terraform-schema#390](https://github.com/hashicorp/terraform-schema/issues/390))
* Support a subset of functions in deployment configurations ([terraform-ls#1799](https://github.com/hashicorp/terraform-ls/issues/1799))
* Support description attribute for orchestration rule block ([terraform-schema#393](https://github.com/hashicorp/terraform-schema/issues/393))
* Support locals in stack and deploy configs ([terraform-schema#395](https://github.com/hashicorp/terraform-schema/issues/395))
* Support depends_on attribute in component blocks ([terraform-schema#392](https://github.com/hashicorp/terraform-schema/issues/392))

BUG FIXES:

* Fix type for provider references in component blocks ([terraform-schema#391](https://github.com/hashicorp/terraform-schema/issues/391))

## 2.33.2024080812 (2024-08-08)

ENHANCEMENTS:

* Parse and load Stack and Deploy metadata ([terraform-ls#1761](https://github.com/hashicorp/terraform-ls/issues/1761))
* Load Stack component sources from metadata ([terraform-ls#1768](https://github.com/hashicorp/terraform-ls/issues/1768))
* Enable early validation for Terraform Stack files ([terraform-ls#1776](https://github.com/hashicorp/terraform-ls/issues/1776))
* Merge stack configuration schema with dynamic schema based on used components source and providers ([terraform-ls#1770](https://github.com/hashicorp/terraform-ls/issues/1770))
* Merge deployment configuration schema with dynamic schema based on available variables ([terraform-ls#1780](https://github.com/hashicorp/terraform-ls/issues/1780))
* Support Terraform functions in stack files ([terraform-ls#1781](https://github.com/hashicorp/terraform-ls/issues/1781))
* Add DecodeReferenceOrigins and DecodeReferenceTargets jobs ([terraform-ls#1786](https://github.com/hashicorp/terraform-ls/issues/1786))

BUG FIXES:

* fix panic on blocks with no labels during validation of label name ([terraform-ls#1791](https://github.com/hashicorp/terraform-ls/issues/1791))

INTERNAL:

* Load embedded provider schemas for providers found in stacks files into state ([terraform-ls#1763](https://github.com/hashicorp/terraform-ls/issues/1763))
* Bump terraform-schema to c2315af ([terraform-ls#1788](https://github.com/hashicorp/terraform-ls/issues/1788))

## 2.33.2024073012 (2024-07-30)

INTERNAL:

* Add development launch target for extensionHost ([#1805](https://github.com/hashicorp/vscode-terraform/issues/1805))
* Replace webpack with esbuild ([#1807](https://github.com/hashicorp/vscode-terraform/issues/1807))

## 2.32.3 (2024-09-05)

ENHANCEMENTS:

* Bump hashicorp/syntax from 0.5.0 to 0.7.0 ([#1820](https://github.com/hashicorp/vscode-terraform/issues/1820))
* Support syntax highlighting for .tftest.hcl and .tfmock.hcl files ([#1831](https://github.com/hashicorp/vscode-terraform/issues/1831))
* Bump terraform-ls from 0.34.2 to 0.34.3 ([#1833](https://github.com/hashicorp/vscode-terraform/issues/1833))

INTERNAL:

* Bump axios to 1.7.4 ([#1818](https://github.com/hashicorp/vscode-terraform/issues/1818))
* Bump braces to 3.0.3 ([#1819](https://github.com/hashicorp/vscode-terraform/issues/1819))

## 2.32.2 (2024-07-30)

BUG FIXES:

* Ensure validation runs after decoding the whole module to avoid stale diagnostics ([terraform-ls#1777](https://github.com/hashicorp/terraform-ls/issues/1777))

## 2.32.1 (2024-07-22)

BUG FIXES:

* Fix validation error by checking for submodules when fetching schemas from the registry ([terraform-ls#1772](https://github.com/hashicorp/terraform-ls/issues/1772))

## 2.32.0 (2024-07-15)

ENHANCEMENTS:

* Add initial support for Terraform Stacks files and Deployment files. This provides block and attribute completion, hover, and diagnostics along with syntax validation for Terraform Stacks and Deployment files ([terraform-ls#1745](https://github.com/hashicorp/terraform-ls/issues/1745))
* Enable completion for all locally installed remote modules ([terraform-ls#1760](https://github.com/hashicorp/terraform-ls/issues/1760))
* Re-architect the language server for improved performance and resource utilization ([terraform-ls#1667](https://github.com/hashicorp/terraform-ls/issues/1667))

This marks the completion of a major refactoring effort. The language server will now start up much faster and use less resources, especially on larger workspaces. We achieve this by doing less work during the initial walk of a workspace. Instead, we only parse modules with open files. Whenever a file of a module is opened, we schedule all the jobs needed to understand the contents of that directory (and the referenced modules).

INTERNAL:

* Introduce a workflow that checks for changelog entries ([#1796](https://github.com/hashicorp/vscode-terraform/issues/1796))

## 2.32.2024070910 (2024-07-09)

ENHANCEMENTS:

* Add initial support for Terraform Stacks files and Deployment files. This provides block and attribute completion, hover, and diagnostics along with syntax validation for Terraform Stacks and Deployment files ([terraform-ls#1745](https://github.com/hashicorp/terraform-ls/issues/1745))

## 2.31.0 (2024-06-27)

ENHANCEMENTS:

* Allow custom HCP Terraform or Terraform Enterprise instance selection ([#1678](https://github.com/hashicorp/vscode-terraform/issues/1678))
* Declare support for Terraform Stack files ([#1773](https://github.com/hashicorp/vscode-terraform/issues/1773))
* Adds file icons for the Stacks language which will apply to all tfstack.hcl and tfdeploy.hcl files ([#1774](https://github.com/hashicorp/vscode-terraform/issues/1774))
* Add support for the new `templatestring` functions in Terraform 1.9 ([terraform-ls#357](https://github.com/hashicorp/terraform-ls/issues/357))
* Introduce provisioners to `removed` blocks in Terraform 1.9 ([terraform-schema#358](https://github.com/hashicorp/terraform-schema/issues/358))

## 2.31.2024061114 (2024-06-11)

ENHANCEMENTS:

* Re-architect the language server for improved performance and resource utilization ([terraform-ls#1667](https://github.com/hashicorp/terraform-ls/issues/1667))

This marks the completion of a major refactoring effort. The language server will now start up much faster and use less resources, especially on larger workspaces. We achieve this by doing less work during the initial walk of a workspace. Instead, we only parse modules with open files. Whenever a file of a module is opened, we schedule all the jobs needed to understand the contents of that directory (and the referenced modules).

We have tested this with workspaces and configurations of different sizes, but still expect some bugs. Please give this preview a try and let us know how it works for you.

## 2.30.2 (2024-06-06)

BUG FIXES:

* Fix data race in schema merging logic ([hcl-lang#397](https://github.com/hashicorp/hcl-lang/issues/397))

INTERNAL:

* Ignore changie logs in vsix package ([#1760](https://github.com/hashicorp/vscode-terraform/issues/1760))
* Remove old web testing infrastructure and update the test GHA ([#1759](https://github.com/hashicorp/vscode-terraform/issues/1759))
* Organize code placement for better maintainability ([#1758](https://github.com/hashicorp/vscode-terraform/issues/1758))
* Use esbuild with webpack to speed up development time ([#1761](https://github.com/hashicorp/vscode-terraform/issues/1761))
* Cache npm packages in GHA ([#1762](https://github.com/hashicorp/vscode-terraform/issues/1762))
* Move TF and HCP Terraform view testing to test folder ([#1765](https://github.com/hashicorp/vscode-terraform/issues/1765))

## 2.30.1 (2024-04-22)

ENHANCEMENTS:

* Fix finding TFC credential file on windows ([#1735](https://github.com/hashicorp/vscode-terraform/pull/1735))
* Rename TFC to HCP Terraform ([#1741](https://github.com/hashicorp/vscode-terraform/pull/1741))
* Rename TFC to HCP Terraform in documentation ([terraform-ls#1687](https://github.com/hashicorp/terraform-ls/pull/1687))
* Rename TFC to HCP Terraform in hover documentation ([terraform-schema#1687](https://github.com/hashicorp/terraform-schema/pull/343))

INTERNAL:

* Add end to end extension to language server testing ([#1739](https://github.com/hashicorp/vscode-terraform/pull/1739))
* Update npm engine requirements to 10 ([#1740](https://github.com/hashicorp/vscode-terraform/pull/1740))
* Update MSW to 2.0 ([#1657](https://github.com/hashicorp/vscode-terraform/pull/1657))
* Bump typescript from 5.4.4 to 5.4.5 ([#1738](https://github.com/hashicorp/vscode-terraform/pull/1738))
* Bump @vscode/vsce from 2.24.0 to 2.25.0 ([#1743](https://github.com/hashicorp/vscode-terraform/pull/1743))
* Bump @playwright/browser-chromium from 1.42.1 to 1.43.1 ([#1742](https://github.com/hashicorp/vscode-terraform/pull/1742))

## 2.30.0 (2024-04-10)

ENHANCEMENTS:

* Support new provider-defined functions ([terraform-ls#1636](https://github.com/hashicorp/terraform-ls/pull/1636))
* Support new provider defined functions syntax ([syntax#99](https://github.com/hashicorp/syntax/pull/99))
* Remove `use_legacy_workflow` from S3 backend ([terraform-schema#338](https://github.com/hashicorp/terraform-schema/pull/338))
* Add `issensitive` function ([terraform-schema#340](https://github.com/hashicorp/terraform-schema/pull/340))
* Conclude `module_variable_optional_attrs` language experiment ([terraform-schema#337](https://github.com/hashicorp/terraform-schema/pull/337))

BUG FIXES:

* Only merge provider-defined functions for Terraform >= 1.8 ([terraform-ls#1672](https://github.com/hashicorp/terraform-ls/pull/1672), [terraform-schema#336](https://github.com/hashicorp/terraform-schema/pull/336))
* Fix panics on `nil` expressions ([hcl-lang#376](https://github.com/hashicorp/hcl-lang/pull/376))
* Fix panics on `nil` expressions in early decoder ([terraform-schema#324](https://github.com/hashicorp/terraform-schema/pull/324))

INTERNAL:

* Webdriver.io End to End Testing ([#1691](https://github.com/hashicorp/vscode-terraform/pull/1691))
* Add test fixture files for E2E test ([#1721](https://github.com/hashicorp/vscode-terraform/pull/1721))
* Remove unused packages ([#1731](https://github.com/hashicorp/vscode-terraform/pull/1731))
* Bump axios from 1.6.5 to 1.6.8 ([#1712](https://github.com/hashicorp/vscode-terraform/pull/1712))
* Bump ts-loader from 9.5.0 to 9.5.1 ([#1715](https://github.com/hashicorp/vscode-terraform/pull/1715))
* Bump chai from 4.3.10 to 4.4.1 ([#1714](https://github.com/hashicorp/vscode-terraform/pull/1714))
* Bump msw from 1.3.2 to 1.3.3 ([#1717](https://github.com/hashicorp/vscode-terraform/pull/1717))
* Bump ts-jest from 29.1.1 to 29.1.2 ([#1720](https://github.com/hashicorp/vscode-terraform/pull/1720))
* Bump typescript from 5.2.2 to 5.4.4 ([#1719](https://github.com/hashicorp/vscode-terraform/pull/1719), [#1734](https://github.com/hashicorp/vscode-terraform/pull/1734))
* Bump @vscode/test-electron from 2.3.8 to 2.3.9 ([#1713](https://github.com/hashicorp/vscode-terraform/pull/1713))
* Bump eslint from 8.53.0 to 8.57.0 ([#1710](https://github.com/hashicorp/vscode-terraform/pull/1710))
* Bump mocha from 10.2.0 to 10.4.0 ([#1728](https://github.com/hashicorp/vscode-terraform/pull/1728))
* Bump @vscode/vsce from 2.22.0 to 2.24.0 ([#1727](https://github.com/hashicorp/vscode-terraform/pull/1727))
* Bump semver from 7.5.4 to 7.6.0 ([#1726](https://github.com/hashicorp/vscode-terraform/pull/1726))
* Bump glob from 10.3.10 to 10.3.12 ([#1725](https://github.com/hashicorp/vscode-terraform/pull/1725))
* Bump webpack from 5.89.0 to 5.91.0 ([#1733](https://github.com/hashicorp/vscode-terraform/pull/1733))
* Bump @playwright/browser-chromium from 1.40.1 to 1.42.1 ([#1718](https://github.com/hashicorp/vscode-terraform/pull/1718))

## 2.29.5 (2024-03-11)

BUG FIXES:

* Fix `for` expression collection constraints ([hcl-lang#375](https://github.com/hashicorp/hcl-lang/pull/375))

INTERNAL:

* build(deps): Bump workflows to latest trusted versions ([#1695](https://github.com/hashicorp/vscode-terraform/pull/1695), [#1704](https://github.com/hashicorp/vscode-terraform/pull/1704), [#1706](https://github.com/hashicorp/vscode-terraform/pull/1706))

## 2.29.4 (2024-02-13)

ENHANCEMENTS:

* Improve module providers and module calls welcome views ([#1676](https://github.com/hashicorp/vscode-terraform/pull/1676))
* Support `for`-`in`-`if` expressions ([hcl-lang#368](https://github.com/hashicorp/hcl-lang/pull/368))

BUG FIXES:

* Fix prefix completion in template interpolation ([hcl-lang#371](https://github.com/hashicorp/hcl-lang/pull/371))
* Fix language server crash on prefix completion with leading space ([hcl-lang#373](https://github.com/hashicorp/hcl-lang/pull/373))
* Fix language server crash on missing symbols in client capabilities ([terraform-ls#1619](https://github.com/hashicorp/terraform-ls/pull/1619))

INTERNAL:

* Add CONTRIBUTING file ([#1680](https://github.com/hashicorp/vscode-terraform/pull/1680))
* build(deps): Bump workflows to latest trusted versions ([#1687](https://github.com/hashicorp/vscode-terraform/pull/1687), [#1690](https://github.com/hashicorp/vscode-terraform/pull/1690))

## 2.29.3 (2024-01-23)

ENHANCEMENTS:

* Remove authentication provider registration to allow disabling the extension ([#1670](https://github.com/hashicorp/vscode-terraform/pull/1670))
* Enable interpolated map keys and object attribute names ([terraform-schema#316](https://github.com/hashicorp/terraform-schema/pull/316))
* Add support for complex index expressions ([hcl-lang#365](https://github.com/hashicorp/hcl-lang/pull/365))
* Add support for parenthesis on RHS ([hcl-lang#366](https://github.com/hashicorp/hcl-lang/pull/366))
* Add support for parenthesis on LHS (map keys & attribute names) ([hcl-lang#367](https://github.com/hashicorp/hcl-lang/pull/367))

BUG FIXES:

* Revert "Alert on `wsl.localhost` Path ([#1522](https://github.com/hashicorp/terraform-ls/pull/1522))" ([#1597](https://github.com/hashicorp/terraform-ls/pull/1597))

INTERNAL:

* build(deps): Bump workflows to latest trusted versions ([#1675](https://github.com/hashicorp/vscode-terraform/pull/1675))

## 2.29.2 (2024-01-16)

BREAKING CHANGES:

* Bump minimal engine version to `1.82.3` ([#1660](https://github.com/hashicorp/vscode-terraform/pull/1660))

ENHANCEMENTS:

* Configure command enablement ([#1643](https://github.com/hashicorp/vscode-terraform/pull/1643))
* Alert on `wsl.localhost` Path ([#1522](https://github.com/hashicorp/terraform-ls/pull/1522))
* Enable `for_each` for `import` blocks (Terraform 1.7) ([terraform-schema#315](https://github.com/hashicorp/terraform-schema/pull/315))
* Add `removed` block (Terraform 1.7)  ([terraform-schema#313](https://github.com/hashicorp/terraform-schema/pull/313))
* Deprecate `use_legacy_workflow` in S3 Backend (Terraform 1.7) ([terraform-schema#314](https://github.com/hashicorp/terraform-schema/pull/314))

BUG FIXES:

* Fix test failures on main ([#1659](https://github.com/hashicorp/vscode-terraform/pull/1659))

INTERNAL:

* Rename `hcl-typeCapsule` to `hcl-typeComplex` ([#1656](https://github.com/hashicorp/vscode-terraform/pull/1656))
* Rename `hcl-traversalStep` to `hcl-referenceStep` ([#1664](https://github.com/hashicorp/vscode-terraform/pull/1664))
* build(deps): Bump workflows to latest trusted versions ([#1655](https://github.com/hashicorp/vscode-terraform/pull/1655), [#1661](https://github.com/hashicorp/vscode-terraform/pull/1661))
* Remove `terraform init` from integration tests ([#1645](https://github.com/hashicorp/vscode-terraform/pull/1645))
* Upgrade `@vscode/test-web` and `js-releases` ([#1662](https://github.com/hashicorp/vscode-terraform/pull/1662))

## 2.29.1 (2023-12-13)

BREAKING CHANGES:

* Publishing extensions for the `win32-ia32` target has been disabled, so we can no longer provide builds for Windows 32bit. (see [microsoft/vscode-vsce#908](https://github.com/microsoft/vscode-vsce/pull/908) and [microsoft/vscode#195559](https://github.com/microsoft/vscode/pull/195559))

ENHANCEMENTS:

* Add new panel for Terraform Cloud structured plans ([#1590](https://github.com/hashicorp/vscode-terraform/pull/1590))
* Add new panel for Terraform Cloud structured applies ([#1647](https://github.com/hashicorp/vscode-terraform/pull/1647))
* Document TFC account log out ([#1642](https://github.com/hashicorp/vscode-terraform/pull/1642))
* Add support for conditional expression ([hcl-lang#326](https://github.com/hashicorp/hcl-lang/pull/326))
* Add support for template expressions ([hcl-lang#322](https://github.com/hashicorp/hcl-lang/pull/322))
* Reflect new SSO endpoint override in S3 backend ([terraform-schema#302](https://github.com/hashicorp/terraform-schema/pull/302))
* Reflect new proxy settings in S3 backend ([terraform-schema#301](https://github.com/hashicorp/terraform-schema/pull/301))
* Reflect new `skip_s3_checksum` attribute in S3 backend ([terraform-schema#295](https://github.com/hashicorp/terraform-schema/pull/295))

BUG FIXES:

* Improve traversal completion for lists, tuples, and sets ([hcl-lang#344](https://github.com/hashicorp/hcl-lang/pull/344))
* Update version resolution for empty constraints ([terraform-schema#296](https://github.com/hashicorp/terraform-schema/pull/296))

INTERNAL:

* Update Node to v18 ([#1625](https://github.com/hashicorp/vscode-terraform/pull/1625))

## 2.29.0 (2023-11-08)

ENHANCEMENTS:

* Login to Terraform Cloud using an Authentication Token
* View Terraform Cloud Workspaces and status detail inside VS Code
* View Terraform Cloud Runs and status detail inside VS Code
* Filter Terraform Cloud Workspaces by Project
* Switch Terraform Cloud Organizations to view different workspaces
* View Plan and Apply logs directly in the editor

BUG FIXES:

* Validate required attributes more selectively to relax `provider` validation ([#1485](https://github.com/hashicorp/terraform-ls/pull/1485))
* Skip inferring variable type from default values ([hcl-lang#338](https://github.com/hashicorp/hcl-lang/pull/338))
* Ensure partially unknown dependent body is handled ([hcl-lang#339](https://github.com/hashicorp/hcl-lang/pull/339))
* Fix type-unaware target collection ([hcl-lang#340](https://github.com/hashicorp/hcl-lang/pull/340))
* Allow variable references in `depends_on` ([terraform-schema#290](https://github.com/hashicorp/terraform-schema/pull/290))
* Fix provider attribute to block conversion ([terraform-schema#288](https://github.com/hashicorp/terraform-schema/pull/288))
* Skip inferring module inputs for default values ([terraform-schema#289](https://github.com/hashicorp/terraform-schema/pull/289))
* Allow local references in `depends_on` ([terraform-schema#292](https://github.com/hashicorp/terraform-schema/pull/292))

## 2.28.2 (2023-10-16)

ENHANCEMENTS:

* Add `skip_requesting_account_id` to `s3` backend ([terraform-schema#279](https://github.com/hashicorp/terraform-schema/pull/279))

BUG FIXES:

* Work around 'unreliable' input data for Registry modules ([terraform-ls#1456](https://github.com/hashicorp/terraform-ls/pull/1456))
* Resolve version correctly for backend schema ([terraform-ls#1453](https://github.com/hashicorp/terraform-ls/pull/1453))
* Allow objects in `for_each` ([hcl-lang#333](https://github.com/hashicorp/hcl-lang/pull/333))
* Fix `output` block `precondition` in 1.2 schema ([terraform-schema#282](https://github.com/hashicorp/terraform-schema/pull/282))

## 2.28.1 (2023-10-06)

ENHANCEMENTS:

* decoder: Add support for binary & unary operators ([hcl-lang#320](https://github.com/hashicorp/hcl-lang/pull/320))

BUG FIXES:

* Fix incorrect schema for `terraform_remote_state` data source ([terraform-schema#272](https://github.com/hashicorp/terraform-schema/pull/272))
* Make `cloud` `organization` optional ([terraform-schema#271](https://github.com/hashicorp/terraform-schema/pull/271))
* Ensure empty objects & tuples still get recognised ([hcl-lang#330](https://github.com/hashicorp/hcl-lang/pull/330))
* Introduce default value `"ssh"` for `type` under `connection` block to enable recognition of attributes such as `bastion_host` even when `type` is not declared ([hcl-lang#327 ([terraform-schema#270](https://github.com/hashicorp/terraform-schema/pull/270))
* Introduce v1.3 proxy related fields for provisioner `connection` block ([terraform-schema#269](https://github.com/hashicorp/terraform-schema/pull/269))
* Ensure `target_platform` is recognised in nested `connection` block ([terraform-schema#268](https://github.com/hashicorp/terraform-schema/pull/268))

## 2.28.0 (2023-10-04)

ENHANCEMENTS:

* Enhanced validation provides additional diagnostics for [selected invalid Terraform language constructs](https://github.com/hashicorp/terraform-ls/blob/v0.32.0/docs/validation.md#enhanced-validation) based on detected Terraform version and provider versions are provided. ([#1368](https://github.com/hashicorp/terraform-ls/pull/1368))
* Improve performance by parsing changed `*.tf` file (as opposed to all files in the module) ([#1404](https://github.com/hashicorp/terraform-ls/pull/1404))
* Improve performance by parsing changed `*.tfvars` file (as opposed to all files in the directory) ([#1422](https://github.com/hashicorp/terraform-ls/pull/1422))
* Add `project` attribute to workspaces block ([terraform-schema#257](https://github.com/hashicorp/terraform-schema/pull/257))
* Update `import` ID to be interpolatable ([terraform-schema#260](https://github.com/hashicorp/terraform-schema/pull/260))
* Add `nullable` to `variable` blocks for `v1.1+` ([terraform-schema#261](https://github.com/hashicorp/terraform-schema/pull/261))
* Add `endpoint` and `domain` to `cos` backend ([terraform-schema#262](https://github.com/hashicorp/terraform-schema/pull/262))
* Add `proxy_url` to `kubernetes` backend ([terraform-schema#263](https://github.com/hashicorp/terraform-schema/pull/263))
* Update `s3` backend with `v1.6` changes ([terraform-schema#265](https://github.com/hashicorp/terraform-schema/pull/265))

BUG FIXES:

* Allow `list(any)` to be passed into `dynamic` block's `for_each` ([hcl-lang#313](https://github.com/hashicorp/hcl-lang/pull/313))
* Make `dynamic` `content` block required ([hcl-lang#314](https://github.com/hashicorp/hcl-lang/pull/314))
* indexer: Ensure declared module calls get decoded ([#1395](https://github.com/hashicorp/terraform-ls/pull/1395))

INTERNAL:

* Bump actions/upload-artifact from 3.1.2 to 3.1.3 ([#1562](https://github.com/hashicorp/vscode-terraform/pull/1562))
* Add sleep to code action test ([#1565](https://github.com/hashicorp/vscode-terraform/pull/1565))
* Bump Terraform version in CI ([#1564](https://github.com/hashicorp/vscode-terraform/pull/1564))
* deps: Bump js-releases to 1.7.0 ([#1563](https://github.com/hashicorp/vscode-terraform/pull/1563))
* Bump actions/checkout from 4.0.0 to 4.1.0 ([#1569](https://github.com/hashicorp/vscode-terraform/pull/1569))

## 2.27.2 (2023-09-06)

ENHANCEMENTS:

* Improve `PreloadEmbeddedSchema` job performance in terraform-ls ([terraform-ls#1369](https://github.com/hashicorp/terraform-ls/pull/1369))
* Avoid re-processing open files in terraform-ls after file saving to improve performance ([terraform-ls#1372](https://github.com/hashicorp/terraform-ls/pull/1372))


INTERNAL:

* Bump actions/setup-node from 3.7.0 to 3.8.1 by ([#1558](https://github.com/hashicorp/vscode-terraform/pull/1558))
* Bump actions/checkout from 3.5.3 to 4.0.0 by ([#1559](https://github.com/hashicorp/vscode-terraform/pull/1559), [#1560](https://github.com/hashicorp/vscode-terraform/pull/1560))

## 2.27.1 (2023-08-02)

ENHANCEMENTS:

* Language Status progress indicator ([#1547](https://github.com/hashicorp/vscode-terraform/pull/1547))
* Explicitly set diagnosticCollectionName to help avoid conflicts with other extensions generating diagnostics ([#1548](https://github.com/hashicorp/vscode-terraform/pull/1548))
* Don't wait for `GetModuleDataFromRegistry` job in terraform-ls to improve performance ([terraform-ls#1332](https://github.com/hashicorp/terraform-ls/pull/1332))

INTERNAL:

* Bump eslint from 8.43.0 to 8.45.0 ([#1529](https://github.com/hashicorp/vscode-terraform/pull/1529), [#1537](https://github.com/hashicorp/vscode-terraform/pull/1537)
* Bump jest from 29.5.0 to 29.6.0 ([#1528](https://github.com/hashicorp/vscode-terraform/pull/1528))
* Bump actions/setup-node from 3.6.0 to 3.7.0 ([#1530](https://github.com/hashicorp/vscode-terraform/pull/1530))
* Bump jest from 29.6.0 to 29.6.1 ([#1531](https://github.com/hashicorp/vscode-terraform/pull/1531))
* Correct invalid json in README.md ([#1477](https://github.com/hashicorp/vscode-terraform/pull/1477))
* Bump glob from 10.3.1 to 10.3.3 ([#1533](https://github.com/hashicorp/vscode-terraform/pull/1533))
* Streamline extension publishing ([#1532](https://github.com/hashicorp/vscode-terraform/pull/1532))
* Bump webpack from 5.88.1 to 5.88.2 ([#1538](https://github.com/hashicorp/vscode-terraform/pull/1538))

## 2.27.0 (2023-07-04)

ENHANCEMENTS:

* Introduce v1.5 `check` block ([terraform-schema#229](https://github.com/hashicorp/terraform-schema/pull/229))
* Introduce v1.5 `import` block ([terraform-schema#228](https://github.com/hashicorp/terraform-schema/pull/228))
* Re-generate function signatures for v1.5 ([terraform-schema#213](https://github.com/hashicorp/terraform-schema/pull/213))
* Add v1.4 `local-exec` provisioner `quiet` attribute ([terraform-schema#218](https://github.com/hashicorp/terraform-schema/pull/218))
* Reflect 1.4 changes in `gcs` backend ([terraform-schema#227](https://github.com/hashicorp/terraform-schema/pull/227))
* Reflect 1.4 changes in `http` backend ([terraform-schema#226](https://github.com/hashicorp/terraform-schema/pull/226))
* Reflect 1.3 & 1.4 changes in `cos` backend ([terraform-schema#217](https://github.com/hashicorp/terraform-schema/pull/217))
* Reflect 1.2 & 1.3 changes in `azurerm` backend ([terraform-schema#225](https://github.com/hashicorp/terraform-schema/pull/225))
* Reflect Terraform 1.4 and 1.5 language changes in the highlighting grammar ([syntax#78](https://github.com/hashicorp/syntax/pull/78))

INTERNAL:

* Add copyright headers automagically instead of failing a check on PRs ([#1456](https://github.com/hashicorp/vscode-terraform/pull/1456))
* Bump @vscode/test-electron from 2.3.0 to 2.3.3 ([#1429](https://github.com/hashicorp/vscode-terraform/pull/1429), [#1479](https://github.com/hashicorp/vscode-terraform/pull/1479))
* Bump actions/checkout from 3.5.2 to 3.5.3 ([#1480](https://github.com/hashicorp/vscode-terraform/pull/1480))
* Bump dessant/lock-threads from 4.0.0 to 4.0.1 ([#1485](https://github.com/hashicorp/vscode-terraform/pull/1485))
* Bump eslint from 8.40.0 to 8.43.0 ([#1439](https://github.com/hashicorp/vscode-terraform/pull/1439), [#1465](https://github.com/hashicorp/vscode-terraform/pull/1465), [#1497](https://github.com/hashicorp/vscode-terraform/pull/1497))
* Bump glob from 10.2.3 to 10.3.1 ([#1433](https://github.com/hashicorp/vscode-terraform/pull/1433), [#1437](https://github.com/hashicorp/vscode-terraform/pull/1437), [#1438](https://github.com/hashicorp/vscode-terraform/pull/1438), [#1471](https://github.com/hashicorp/vscode-terraform/pull/1471), [#1512](https://github.com/hashicorp/vscode-terraform/pull/1512), [#1519](https://github.com/hashicorp/vscode-terraform/pull/1519))
* Bump ts-jest from 29.1.0 to 29.1.1 ([#1527](https://github.com/hashicorp/vscode-terraform/pull/1527))
* Bump ts-loader from 9.4.2 to 9.4.4 ([#1442](https://github.com/hashicorp/vscode-terraform/pull/1442), [#1522](https://github.com/hashicorp/vscode-terraform/pull/1522))
* Bump typescript from 5.0.4 to 5.1.6 ([#1462](https://github.com/hashicorp/vscode-terraform/pull/1462), [#1523](https://github.com/hashicorp/vscode-terraform/pull/1523))
* Bump webpack from 5.82.1 to 5.88.1 ([#1436](https://github.com/hashicorp/vscode-terraform/pull/1436), [#1446](https://github.com/hashicorp/vscode-terraform/pull/1446), [#1450](https://github.com/hashicorp/vscode-terraform/pull/1450), [#1461](https://github.com/hashicorp/vscode-terraform/pull/1461), [#1469](https://github.com/hashicorp/vscode-terraform/pull/1469), [#1474](https://github.com/hashicorp/vscode-terraform/pull/1474), [#1492](https://github.com/hashicorp/vscode-terraform/pull/1492), [#1513](https://github.com/hashicorp/vscode-terraform/pull/1513), [#1521](https://github.com/hashicorp/vscode-terraform/pull/1521))
* Bump webpack-cli from 5.1.1 to 5.1.4 ([#1464](https://github.com/hashicorp/vscode-terraform/pull/1464), [#1473](https://github.com/hashicorp/vscode-terraform/pull/1473))
* deps: bump semver to 7.5.3 ([#1515](https://github.com/hashicorp/vscode-terraform/pull/1515))
* Switch to GitHub issue form templates ([#1463](https://github.com/hashicorp/vscode-terraform/pull/1463))

## 2.26.1 (2023-05-11)

BUG FIXES:

* Fix crash on prefix completion ([hcl-lang#275](https://github.com/hashicorp/hcl-lang/pull/275))

INTERNAL:

* Update vscode-languageclient to `8.1.0` ([#1408](https://github.com/hashicorp/vscode-terraform/pull/1408))
* Bump VS Code from `1.67.2` to `1.75.1` ([#1409](https://github.com/hashicorp/vscode-terraform/pull/1409))
* Onboard to pre-release extensions ([#1412](https://github.com/hashicorp/vscode-terraform/pull/1412))
* Remove default activation events ([#1419](https://github.com/hashicorp/vscode-terraform/pull/1419))
* Remove legacy settings ([#1414](https://github.com/hashicorp/vscode-terraform/pull/1414))

## 2.26.0 (2023-04-27)

BUG FIXES:

* When completing `LiteralValue` do not ignore `Description` & `IsDeprecated` fields ([hcl-lang#253](https://github.com/hashicorp/hcl-lang/pull/253))
* Provide completion for `Tuple` attribute types and values ([hcl-lang#255](https://github.com/hashicorp/hcl-lang/pull/255))
* Display `Tuple` hover data on invalid elements ([hcl-lang#254](https://github.com/hashicorp/hcl-lang/pull/254))
* Display fully inferred type of List, Set, Tuple, Map and Object complex types ([hcl-lang#259](https://github.com/hashicorp/hcl-lang/pull/259))
* Collect targets w/ interpolation for `Any` correctly ([hcl-lang#257](https://github.com/hashicorp/hcl-lang/pull/257))
* Fix remote backend usage in ([terraform-ls#1218](https://github.com/hashicorp/terraform-ls/pull/1218))
* Display completion label details even if empty by updating to gopls v0.10.0 tsprotocol.go to ([#1256](https://github.com/hashicorp/terraform-ls/pull/1256))

ENHANCEMENTS:

* Improve editor performance in cases where Terraform module information is unavailable due to private registries, submodules, no network, or other similiar situations ([terraform-ls#1258](https://github.com/hashicorp/terraform-ls/pull/1258))
* Add completion, hover, semantic highlighting and go-to-* support for nested expressions within objects, maps, lists, sets and tuples ([terraform-ls#1237](https://github.com/hashicorp/terraform-ls/pull/1237), [hcl-lang#232](https://github.com/hashicorp/hcl-lang/pull/232), [hcl-lang#203](https://github.com/hashicorp/hcl-lang/pull/203), [hcl-lang#199](https://github.com/hashicorp/hcl-lang/pull/199), [hcl-lang#186](https://github.com/hashicorp/hcl-lang/pull/186), [hcl-lang#185](https://github.com/hashicorp/hcl-lang/pull/185), [hcl-lang#184](https://github.com/hashicorp/hcl-lang/pull/184))
* Add completion, hover and semantic highlighting for nested types in type declarations within `variable` `type` ([hcl-lang#183](https://github.com/hashicorp/hcl-lang/pull/183))
* Add support for function signature completion, hover and more ([terraform-ls#1077](https://github.com/hashicorp/terraform-ls/pull/1077))
* Recognise new semantic token types for function names ([#1371](https://github.com/hashicorp/vscode-terraform/pull/1371), [terraform-ls#1233](https://github.com/hashicorp/terraform-ls/pull/1233))

INTERNAL:

* Add copywrite GHA ([#1347](https://github.com/hashicorp/vscode-terraform/pull/1347))
* Add TFC usage detection ([#1208](https://github.com/hashicorp/terraform-ls/pull/1208))

## 2.25.4 (2023-02-22)

BUG FIXES:

 - Bundle static builds of Linux binaries (again) ([terraform-ls#1193](https://github.com/hashicorp/terraform-ls/issues/1193))

## 2.25.3 (2023-02-22)

BUG FIXES:

 - Ignore inaccessible files (such as emacs backup files) ([terraform-ls#1172](https://github.com/hashicorp/terraform-ls/issues/1067))
 - Fix crash when parsing JSON files (introduced in 2.25.0) ([hcl-lang#202](https://github.com/hashicorp/hcl-lang/pull/202))
 - Fix spelling of preview in readme ([#1329](https://github.com/hashicorp/vscode-terraform/pull/1329))

ENHANCEMENTS:

 - Show detected Terraform Version in status bar ([#1325](https://github.com/hashicorp/vscode-terraform/pull/1325))
 - Improve error handling on initialization ([#1327](https://github.com/hashicorp/vscode-terraform/pull/1327))
 - Parse `optional()` object attribute _default values_ correctly, as introduced in Terraform v1.3 ([terraform-schema#184](https://github.com/hashicorp/terraform-schema/pull/184))
 

## 2.25.2 (2022-12-15)

BUG FIXES:

 - Improve attribute name matching ([syntax#49](https://github.com/hashicorp/syntax/pull/49))

## 2.25.1 (2022-12-01)

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

## 2.25.0 (2022-11-14)

ENHANCEMENTS:

 - Publish Terrafor Web Extension by [#1210](https://github.com/hashicorp/vscode-terraform/pull/1210)

INTERNAL:

 - Use `npm ci` for installing dependencies inside CI [#1257](https://github.com/hashicorp/vscode-terraform/pull/1257)
 - Enable publishing web extensions [#1262](https://github.com/hashicorp/vscode-terraform/pull/1262)
 - [COMPLIANCE] Update MPL 2.0 LICENSE [#1247](https://github.com/hashicorp/vscode-terraform/pull/1247)

## 2.24.3 (2022-10-13)

ENHANCEMENTS:

 - Significantly reduce the memory footprint of the language server by 85% to 98% for most users ([terraform-ls#1071](https://github.com/hashicorp/terraform-ls/pull/1071))

BUG FIXES:

 - Fix enable terraform-ls after disabling [#1238](https://github.com/hashicorp/vscode-terraform/pull/1238)
 - fix: Enable IntelliSense for resources & data sources whose name match the provider (e.g. `data`) ([terraform-ls#1072](https://github.com/hashicorp/terraform-ls/pull/1072))
 - fix: avoid infinite recursion (surfaced as crash with "goroutine stack exceeds 1000000000-byte limit" message) ([terraform-ls#1084](https://github.com/hashicorp/terraform-ls/pull/1084))
 - fix: race condition in terraform-schema (surfaced as crash with "fatal error: concurrent map read and map write" message) ([terraform-ls#1086](https://github.com/hashicorp/terraform-ls/pull/1086))

INTERNAL:

 - Reduce duplicate error telemetry [#1230](https://github.com/hashicorp/vscode-terraform/pull/1230)

## 2.24.2 (2022-09-07)

ENHANCEMENTS:

 - Ask user to use Remote WSL Extension when using WSL UNC Paths [#1219](https://github.com/hashicorp/vscode-terraform/pull/1219)

BUG FIXES:

 - fix: Improve IntelliSense accuracy by tracking provider schema versions (bug introduced in 2.24.0) ([terraform-ls#1060](https://github.com/hashicorp/terraform-ls/pull/1060))
 - Don't query the Terraform Registry for module sources starting with `.` in completion ([terraform-ls#1062](https://github.com/hashicorp/terraform-ls/pull/1062))
 - fix race condition (panic) in schema merging ([terraform-schema#137](https://github.com/hashicorp/terraform-schema/pull/137))

INTERNAL:

- Improve error telemetry [#1215](https://github.com/hashicorp/vscode-terraform/pull/1215)

## 2.24.1 (2022-08-24)

ENHANCEMENTS:

 - Add link to post explaining vim plugin installation ([terraform-ls#1044](https://github.com/hashicorp/terraform-ls/pull/1044))

BUG FIXES:

 - Fix panic on obtaining provider schemas ([terraform-ls#1048](https://github.com/hashicorp/terraform-ls/pull/1048))
 - Use correct ldflag (versionPrerelease) when compiling LS ([terraform-ls#1043](https://github.com/hashicorp/terraform-ls/pull/1043))

## 2.24.0 (2022-08-23)

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

## 2.23.0 (2022-06-09)

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

## 2.22.0 (2022-04-19)

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

## 2.21.0 (2022-03-21)

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

## 2.20.1 (2022-03-17)

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

## 2.20.0 (2022-03-01)

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

## 2.19.0 (2022-01-20)

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

## 2.18.0 (2022-01-07)

ENHANCEMENTS:

 - Improve language server installation ([#868](https://github.com/hashicorp/vscode-terraform/pull/868))
 - Make reference count code lens opt-in (disabled by default) ([#893](https://github.com/hashicorp/vscode-terraform/pull/893))

BUG FIXES:

 - Fix Terraform file detection ([#870](https://github.com/hashicorp/vscode-terraform/pull/870))

INTERNAL:

 - deps: bump vscode-extension-telemetry to 0.4.4 ([#884](https://github.com/hashicorp/vscode-terraform/pull/884))

## 2.17.0 (2021-12-02)

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

## 2.16.0 (2021-10-14)

ENHANCEMENTS:

 - Add module calls view to Explorer pane ([#746](https://github.com/hashicorp/vscode-terraform/pulls/746))
 - Add experimental `prefillRequiredFields` feature ([#799](https://github.com/hashicorp/vscode-terraform/pulls/799))
 - Install LS into dedicated persistent global storage (to avoid the need for LS reinstallation upon extension upgrade) ([#811](https://github.com/hashicorp/vscode-terraform/pulls/811))

INTERNAL:

 - deps: bump vscode-extension-telemetry to 0.4.2 ([#790](https://github.com/hashicorp/vscode-terraform/pulls/790))

## 2.15.0 (2021-09-22)

ENHANCEMENTS:

 - Add support for language server side config option `terraformExecPath` ([#741](https://github.com/hashicorp/vscode-terraform/pulls/741))
 - Add support for language server side config option `terraformExecTimeout` ([#741](https://github.com/hashicorp/vscode-terraform/pulls/741))
 - Add support for language server side config option `terraformLogFilePath` ([#741](https://github.com/hashicorp/vscode-terraform/pulls/741))

BUG FIXES:

 - fix: avoid tracking client which is not ready yet ([#778](https://github.com/hashicorp/vscode-terraform/pulls/778))
 - fix: avoid considering output panes as editors ([#771](https://github.com/hashicorp/vscode-terraform/pulls/771))

## 2.14.0 (2021-07-22)

FEATURES:

 - Register command to show references ([#686](https://github.com/hashicorp/vscode-terraform/pulls/686))

ENHANCEMENTS:

 - Install native LS build for Apple Silicon (darwin/arm64) ([#563](https://github.com/hashicorp/vscode-terraform/pulls/563))
 - Add semver based version pin for Language Server via `requiredVersion` config option ([#656](https://github.com/hashicorp/vscode-terraform/pulls/656))
 - Improve error handling ([#691](https://github.com/hashicorp/vscode-terraform/pulls/691))

BUG FIXES:

 - fix: launch LS even if path contains escapable characters ([#694](https://github.com/hashicorp/vscode-terraform/pulls/694))

## 2.13.2 (2021-07-19)

BUG FIXES:

 - Fix language server update logic ([#690](https://github.com/hashicorp/vscode-terraform/pulls/690))

## 2.13.1 (2021-07-16)

BUG FIXES:

 - Fix DocumentSelector for multi-folder workspace ([#688](https://github.com/hashicorp/vscode-terraform/pulls/688))

## 2.13.0 (2021-06-23)

FEATURES:

 - Add support for Terraform variable files (`tfvars`) ([#661](https://github.com/hashicorp/vscode-terraform/pulls/661))

## 2.12.1 (2021-06-11)

BUG FIXES:

 - Avoid duplicate language clients for non-multi-folder setup ([#663](https://github.com/hashicorp/vscode-terraform/pulls/663))

## 2.12.0 (2021-06-08)

BUG FIXES:

 - Avoid launching more servers if server supports multiple folders ([#654](https://github.com/hashicorp/vscode-terraform/pulls/654))

INTERNAL:

 - Rename `rootModules` command to `module.callers` ([#633](https://github.com/hashicorp/vscode-terraform/pulls/633))

## 2.11.0 (2021-05-18)

BUG FIXES:

* Reorder functions to prioritize abspath highlight ([#630](https://github.com/hashicorp/vscode-terraform/pulls/630))
* Only trigger language server auto update once ([#623](https://github.com/hashicorp/vscode-terraform/pulls/623))

## 2.10.2 (2021-05-03)

BUG FIXES:

* Correct delay for language server version check ([#620](https://github.com/hashicorp/vscode-terraform/pulls/620))

## 2.10.1 (2021-04-28)

BUG FIXES:

* Update js-releases dependency to resolve security issue [HCSEC-2021-12](https://discuss.hashicorp.com/t/hcsec-2021-12-codecov-security-event-and-hashicorp-gpg-key-exposure/23512) ([#612](https://github.com/hashicorp/vscode-terraform/pulls/612))

## 2.10.0 (2021-04-13)

ENHANCEMENTS:

* Update syntax highlighting for Terraform 0.15 ([#604](https://github.com/hashicorp/vscode-terraform/pulls/604))

## 2.9.1 (2021-03-24)

BUG FIXES:

* Fix contents of vsix package

## 2.9.0 (2021-03-24)

ENHANCEMENTS:

* Check for language server updates every 24 hours ([#595](https://github.com/hashicorp/vscode-terraform/pulls/595))

BUG FIXES:

* Normalize language server installer file paths ([#589](https://github.com/hashicorp/vscode-terraform/pulls/589))
* Disable statusbar feature if a custom language server is in use ([#593](https://github.com/hashicorp/vscode-terraform/pulls/593))

## 2.8.3 (2021-03-16)

ENHANCEMENTS:

* Update client telemetry ([#587](https://github.com/hashicorp/vscode-terraform/pulls/587))

## 2.8.2 (2021-03-11)

ENHANCEMENTS:

* Change telemetry value for the language server version to make it easier to filter ([#582](https://github.com/hashicorp/vscode-terraform/pulls/582))

BUG FIXES:

* Match correct language server binary name per platform – fixes language server upgrade problems on Windows ([#583](https://github.com/hashicorp/vscode-terraform/pulls/583))
* Rescue version check errors on language server install ([#584](https://github.com/hashicorp/vscode-terraform/pulls/584))

## 2.8.1 (2021-03-10)

BUG FIXES:

* Improve error message for failed language server install ([#580](https://github.com/hashicorp/vscode-terraform/pulls/580))
* Add telemetry for tracking language server installed and upgrade versions ([#579](https://github.com/hashicorp/vscode-terraform/pulls/579))

## 2.8.0 (2021-03-09)

ENHANCEMENTS:

* Add stopClient and execWorkspaceCommand telemetry events ([#577](https://github.com/hashicorp/vscode-terraform/pulls/577))

BUG FIXES:

* Cancel language server install when upgrade message is closed ([#570](https://github.com/hashicorp/vscode-terraform/pulls/570))

## 2.7.0 (2021-02-22)

ENHANCEMENTS:

* Add telemetry for error reporting ([#557](https://github.com/hashicorp/vscode-terraform/pulls/557))
* Use version JSON output of LS during installation ([#560](https://github.com/hashicorp/vscode-terraform/pulls/560))

## 2.6.0 (2021-02-09)

FEATURES:

* Execute terraform plan and apply using the VSCode terminal ([#551](https://github.com/hashicorp/vscode-terraform/pulls/551))

## 2.5.0 (2021-01-14)

FEATURES:

* Add setting for experimental features to enable validateOnSave ([#536](https://github.com/hashicorp/vscode-terraform/pulls/536))
* Add terraform validate command ([#540](https://github.com/hashicorp/vscode-terraform/pulls/540))

## 2.4.0 (2021-01-07)

FEATURES:

* Use amd64 binary to support Apple Silicon Macs ([#527](https://github.com/hashicorp/vscode-terraform/pulls/527))
* Add command and statusbar interface for running terraform init ([#495](https://github.com/hashicorp/vscode-terraform/pulls/495))

ENHANCEMENTS:

* Read LS version from stdout ([#512](https://github.com/hashicorp/vscode-terraform/pulls/512))
* Prepare for semantic token based highlighting ([#523](https://github.com/hashicorp/vscode-terraform/pulls/523))

## 2.3.0 (2020-11-12)

NOTES:

* Set up integration tests in GitHub actions ([#483](https://github.com/hashicorp/vscode-terraform/pulls/483))

BUG FIXES:

* Fix 32bit downloads of language server ([#483](https://github.com/hashicorp/vscode-terraform/pulls/483))
* Prune nested workspace folders to prevent running multiple language servers for the same directory ([#499](https://github.com/hashicorp/vscode-terraform/pulls/499))
* Prefix workspace command names to prevent multi-instance name collisions ([#514](https://github.com/hashicorp/vscode-terraform/pulls/514))

## 2.2.3 (2020-09-03)

BUG FIXES:

* Update object syntax highlighting to fix unmatched cases ([#485](https://github.com/hashicorp/vscode-terraform/pulls/485))

## 2.2.2 (2020-08-25)

BUG FIXES:

* Fix additional object key matching issues ([#478](https://github.com/hashicorp/vscode-terraform/pulls/478))

## 2.2.1 (2020-08-24)

BUG FIXES:

* Fix object key syntax highlighting ([#475](https://github.com/hashicorp/vscode-terraform/pulls/475))

## 2.2.0 (2020-08-20)

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

## 2.1.1 (2020-07-15)

BUG FIXES:

* Fix race in shasum verification ([#438](https://github.com/hashicorp/vscode-terraform/pulls/438))

## 2.1.0 (2020-07-14)

ENHANCEMENTS:

* Verify shasum of language server binary on install ([#414](https://github.com/hashicorp/vscode-terraform/pulls/414))
* Add link to language server changelog on completed install ([#424](https://github.com/hashicorp/vscode-terraform/pulls/424))
* Add syntax for object and tuple structural types ([#428](https://github.com/hashicorp/vscode-terraform/pulls/428))
* Add setting for workspace root module configuration ([#423](https://github.com/hashicorp/vscode-terraform/pulls/423))

## 2.0.2 (2020-06-23)

BUG FIXES:

* Hide language server output window to prevent stealing focus ([#408](https://github.com/hashicorp/vscode-terraform/pulls/408))

## 2.0.1 (2020-06-10)

BUG FIXES:

Fix for Marketplace listing issue

## 2.0.0 (2020-06-10)

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

