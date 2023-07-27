/**
 * Copyright (c) HashiCorp, Inc.
 * SPDX-License-Identifier: MPL-2.0
 */

import * as vscode from 'vscode';

const installedVersion = vscode.languages.createLanguageStatusItem('terraform.installedVersion', [
  { language: 'terraform' },
  { language: 'terraform-vars' },
]);
installedVersion.name = 'TerraformInstalledVersion';
installedVersion.detail = 'Terraform Installed';

export function setVersion(version: string) {
  installedVersion.text = version;
}

export function setReady() {
  installedVersion.busy = false;
}

export function setWaiting() {
  installedVersion.busy = true;
}
