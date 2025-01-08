// Copyright (c) The OpenTofu Authors
// SPDX-License-Identifier: MPL-2.0
// Copyright (c) HashiCorp, Inc.
// SPDX-License-Identifier: MPL-2.0

import * as vscode from 'vscode';

const lsStatus = vscode.languages.createLanguageStatusItem('terraform-ls.status', [
  { language: 'terraform' },
  { language: 'terraform-vars' },
]);
lsStatus.name = 'OpenTofu LS';
lsStatus.detail = 'OpenTofu LS';

export function setVersion(version: string) {
  lsStatus.text = version;
}

export function setLanguageServerRunning() {
  lsStatus.busy = false;
}

export function setLanguageServerReady() {
  lsStatus.busy = false;
}

export function setLanguageServerStarting() {
  lsStatus.busy = true;
}

export function setLanguageServerBusy() {
  lsStatus.busy = true;
}

export function setLanguageServerStopped() {
  // this makes the statusItem a different color in the bar
  // and triggers an alert, so the user 'sees' that the LS is stopped
  lsStatus.severity = vscode.LanguageStatusSeverity.Warning;
  lsStatus.busy = false;
}

export function setLanguageServerState(
  detail: string,
  busy: boolean,
  severity: vscode.LanguageStatusSeverity = vscode.LanguageStatusSeverity.Information,
) {
  lsStatus.busy = busy;
  lsStatus.detail = detail;
  lsStatus.severity = severity;
}
