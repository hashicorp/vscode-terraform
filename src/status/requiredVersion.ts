/**
 * Copyright (c) HashiCorp, Inc.
 * SPDX-License-Identifier: MPL-2.0
 */

import * as vscode from 'vscode';

const requiredVersion = vscode.languages.createLanguageStatusItem('terraform.requiredVersion', [
  { language: 'terraform' },
  { language: 'terraform-vars' },
]);
requiredVersion.name = 'TerraformRequiredVersion';
requiredVersion.detail = 'Terraform Required';

export function setVersion(version: string) {
  requiredVersion.text = version;
}

export function setReady() {
  requiredVersion.busy = false;
}

export function setWaiting() {
  requiredVersion.busy = true;
}
