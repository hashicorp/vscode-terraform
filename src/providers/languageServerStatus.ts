import * as vscode from 'vscode';

const selector: vscode.DocumentSelector = [
  { scheme: 'file', language: 'terraform' },
  { scheme: 'file', language: 'terraform-vars' },
];

const langStatus = vscode.languages.createLanguageStatusItem('terraform.ls', selector);
langStatus.name = 'Terraform Language Server';
langStatus.command = {
  command: 'terraform.languageServerCommands',
  title: 'Enable or disable language server',
};

// set initial values so something is shown until terraform-ls is started
langStatus.severity = vscode.LanguageStatusSeverity.Information;
langStatus.busy = true;
langStatus.detail = 'terraform-ls';
langStatus.text = '0.1.0';

export function setLanguageServerVersion(text: string) {
  // use `text` so the version number is shown in the bar
  // when the statusItem is pinned
  // `detail` is hidden when pinned and shown on hover
  langStatus.text = text;
}

export function setLanguageServerRunning() {
  // the ls is running now, so remove busy indicator and
  // ensure the ls name is shown instead of state
  langStatus.busy = false;
  langStatus.detail = 'terraform-ls';
}

export function setLanguageServerStarting() {
  // in case it takes a long time, `detail` can be seen
  // by the user in the bar. keep `text` for version info
  langStatus.detail = 'Starting terraform-ls';
  langStatus.busy = true;
}

export function setLanguageServerStopped() {
  // `detail` can be seen by the user in the bar so we use that here
  // keep `text` for version info
  langStatus.detail = 'Stopped terraform-ls';
  // this makes the statusItem a different color in the bar
  // and triggers an alert, so the user 'sees' that the ls is stopped
  langStatus.severity = vscode.LanguageStatusSeverity.Warning;
  langStatus.busy = false;
}

export function setLanguageServerState(detail: string, busy: boolean, severity: vscode.LanguageStatusSeverity) {
  langStatus.busy = busy;
  langStatus.detail = detail;
  langStatus.severity = severity;
}
