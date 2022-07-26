import TelemetryReporter from '@vscode/extension-telemetry';
import * as vscode from 'vscode';
import {
  LanguageClient,
  WorkDoneProgress,
  WorkDoneProgressBegin,
  WorkDoneProgressEnd,
  WorkDoneProgressReport,
} from 'vscode-languageclient/node';
import * as terraform from '../terraform';

export class TerraformCommands implements vscode.Disposable {
  private disposables: vscode.Disposable[];

  constructor(private client: LanguageClient, private reporter: TelemetryReporter) {
    this.disposables = [
      vscode.commands.registerCommand('terraform.init', async () => {
        await terraform.initAskUserCommand(this.client, this.reporter);
      }),
      vscode.commands.registerCommand('terraform.initCurrent', async () => {
        await terraform.initCurrentOpenFileCommand(this.client, this.reporter);
      }),
      vscode.commands.registerCommand('terraform.apply', async () => {
        await terraform.command('apply', this.client, this.reporter, true);
      }),
      vscode.commands.registerCommand('terraform.plan', async () => {
        await terraform.command('plan', this.client, this.reporter, true);
      }),
      vscode.commands.registerCommand('terraform.validate', async () => {
        await terraform.command('validate', this.client, this.reporter);
      }),
    ];

    [
      {
        cmd: 'terraform-ls.terraform.init',
        bar: vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 0),
      },
      {
        cmd: 'terraform-ls.terraform.validate',
        bar: vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 0),
      },
    ].forEach((command) => {
      this.disposables.push(
        command.bar,
        this.client.onProgress(WorkDoneProgress.type, command.cmd, (event) => {
          this.reportStatus(command.bar, event);
        }),
      );
    });
  }

  private reportStatus(
    statusBar: vscode.StatusBarItem,
    event: WorkDoneProgressBegin | WorkDoneProgressReport | WorkDoneProgressEnd,
  ) {
    switch (event.kind) {
      case 'begin':
        statusBar.show();
        statusBar.text = `$(sync~spin) ${event.title ?? event.message}`;
        break;
      case 'report':
        statusBar.text = `$(sync~spin) ${event.message}`;
        break;
      case 'end':
        statusBar.text = `${event.message}`;
        statusBar.hide();
        break;
    }
  }

  dispose() {
    this.disposables.forEach((c) => c.dispose());
  }
}
