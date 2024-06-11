#!/bin/bash
# Copyright (c) HashiCorp, Inc.
# SPDX-License-Identifier: MPL-2.0

set -eEuo pipefail

SCRIPT_RELATIVE_DIR=$(dirname "${BASH_SOURCE[0]}")
ROOT_RELATIVE_DIR=$(dirname "${SCRIPT_RELATIVE_DIR}")

cd $ROOT_RELATIVE_DIR

# Get current version info
VERSION=$(cat package.json | jq -r '.version') # e.g. 2.26.0
MAJOR=$(echo $VERSION | cut -d. -f1)
MINOR=$(echo $VERSION | cut -d. -f2)
# Build new version
#
# For the pre-release build, we keep the major and minor versions
# and add the timestamp of the last commit as a patch.
NEW_PATCH=`git log -1 --format=%cd --date="format:%Y%m%d%H"` # e.g. 2023050312
VER="$MAJOR.$MINOR.$NEW_PATCH"

npm version $VER --no-git-tag-version --no-commit-hooks

changie batch "v$VER"
changie merge
