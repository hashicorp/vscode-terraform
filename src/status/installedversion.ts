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

export function Ready() {
  installedVersion.busy = false;
}

export function Waiting() {
  installedVersion.busy = true;
}
