#!/bin/bash

# Exit immediately if a command exits with a non-zero status
set -eEuo pipefail

# URL to fetch the JSON from
URL="https://releases.hashicorp.com/terraform-ls/index.json"

# Get the version type from the first argument, default to stable if not provided
VERSION_TYPE=${1:-stable}
if [ "$VERSION_TYPE" == "stable" ]; then
  LATEST_VERSION=$(curl -s $URL | jq -r '.versions | keys[]' | grep -E '^[0-9]+\.[0-9]+\.[0-9]+$' | sort -V | tail -n 1)
elif [ "$VERSION_TYPE" == "prerelease" ]; then
  LATEST_VERSION=$(curl -s $URL | jq -r '.versions | keys[]' | grep -E '^[0-9]+\.[0-9]+\.[0-9]+-.+$' | sort -V | tail -n 1)
else
  echo "Invalid version type specified. Use 'stable' or 'prerelease'."
  exit 1
fi
echo "Latest $VERSION_TYPE version of terraform-ls: $LATEST_VERSION"

# Get the current langServer.version from the package.json file
CURRENT_VERSION=$(jq -r '.langServer.version' package.json)

# Update the langServer.version in the package.json file
jq --arg version "$LATEST_VERSION" '.langServer.version = $version' package.json > package.tmp && mv package.tmp package.json

# If there are no changes, exit early
if [ "$(git status --porcelain)" == "" ]; then
  echo "Current version of terraform-ls is already $LATEST_VERSION"
  exit 0
fi

git add .
git commit -m "Bump terraform-ls from $CURRENT_VERSION to $LATEST_VERSION"

# Create a pull request and capture the output
PR_OUTPUT=$(gh pr create --fill --draft --assignee @me)
PR_ID=$(echo "$PR_OUTPUT" | grep -oP 'https://github.com/[^/]+/[^/]+/pull/\K[0-9]+')

# Add changelog entry with the PR ID
changie new -d -b "Bump terraform-ls from $CURRENT_VERSION to $LATEST_VERSION" -k ENHANCEMENTS --custom Repository=terraform-ls --custom Issue="$PR_ID"

# Commit the changelog changes
git add .
git commit -m "Add changelog entry for terraform-ls $LATEST_VERSION"

# Get the branch name to push to from PR_ID
BRANCH_NAME=$(gh pr view $PR_ID --json headRefName -q '.headRefName')

# Push the changes to the branch
git push origin $BRANCH_NAME
