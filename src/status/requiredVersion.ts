// Copyright (c) The OpenTofu Authors
// SPDX-License-Identifier: MPL-2.0
// Copyright (c) HashiCorp, Inc.
// SPDX-License-Identifier: MPL-2.0

import * as vscode from 'vscode';

const requiredVersion = vscode.languages.createLanguageStatusItem('opentofu.requiredVersion', [
  { language: 'terraform' },
  { language: 'terraform-vars' },
]);
requiredVersion.name = 'OpenTofuRequiredVersion';
requiredVersion.detail = 'OpenTofu Required';

export function setVersion(version: string) {
  requiredVersion.text = version;
}

export function setReady() {
  requiredVersion.busy = false;
}

export function setWaiting() {
  requiredVersion.busy = true;
}
