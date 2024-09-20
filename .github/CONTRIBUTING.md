# Contributing to the OpenTofu Extension for VS Code

## Reporting Feedback

The OpenTofu Extension for VS Code is an open source project and we appreciate
contributions of various kinds, including bug reports and fixes,
enhancement proposals, documentation updates, and user experience feedback.

To record a bug report, enhancement proposal, or give any other product
feedback, please [open a GitHub issue](https://github.com/gamunu/vscode-opentofu/issues/new/choose)
using the most appropriate issue template. Please do fill in all of the
information the issue templates request, because we've seen from experience that
this will maximize the chance that we'll be able to act on your feedback.


## Development

Please see [DEVELOPMENT.md](../DEVELOPMENT.md).

## Releasing

Releases are made on a reasonably regular basis by the maintainers, using our internal tooling. The following notes are only relevant to maintainers.

Release Process:

1. Create a release branch/PR with the following changes:

   - Bump the language server version in `package.json` if the release should include a LS update
   - Update the [CHANGELOG.md](../CHANGELOG.md) with the recent changes
   - Bump the version in `package.json` (and `package-lock.json`) by using `npm version 2.X.Y`

1. Review & merge the branch and wait for the [Test Workflow](https://github.com/gamunu/vscode-opentofu/actions/workflows/test.yml) on `main` to complete
1. Run the [Deploy Workflow](https://github.com/gamunu/vscode-opentofu/actions/workflows/deploy.yml) from `main` for a `stable` release
1. Wait for publishing & processing to complete
1. Create a new release & tag on GitHub for the version `v2.X.Y` and copy over the changelog
1. Optional: Wait ~10 minutes and run the [Deploy Workflow](https://github.com/gamunu/vscode-opentofu/actions/workflows/deploy.yml) from `main` for a `prerelease` release to also update the preview extension
