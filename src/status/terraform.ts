import * as vscode from 'vscode';

const terraformStatus = vscode.languages.createLanguageStatusItem('terraform.status', [
  { language: 'terraform' },
  { language: 'terraform-vars' },
]);
terraformStatus.name = 'Terraform';
terraformStatus.detail = 'Terraform';
terraformStatus.command = {
  command: 'terraform.commands',
  title: 'Terraform Commands',
  tooltip: 'foo',
};

export function setTerraformState(
  detail: string,
  busy: boolean,
  severity: vscode.LanguageStatusSeverity = vscode.LanguageStatusSeverity.Information,
) {
  terraformStatus.busy = busy;
  terraformStatus.detail = detail;
  terraformStatus.severity = severity;
}

export function setTerraformVersion(version: string) {
  terraformStatus.text = version;
}
