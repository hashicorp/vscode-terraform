import * as vscode from 'vscode';
import { CloseAction, ErrorAction, ErrorHandler, Message } from 'vscode-languageclient';

export class ExtensionErrorHandler implements ErrorHandler {
  constructor(private outputChannel: vscode.OutputChannel) {}
  error(error: Error, message: Message | undefined, count: number | undefined): ErrorAction {
    vscode.window.showErrorMessage(`Terraform LS connection error: (${count})\n${error.message}\n${message?.jsonrpc}`);

    return ErrorAction.Continue;
  }
  closed(): CloseAction {
    this.outputChannel.appendLine(
      `Failure to start terraform-ls. Please check your configuration settings and reload this window`,
    );

    vscode.window
      .showErrorMessage(
        'Failure to start terraform-ls. Please check your configuration settings and reload this window',
        {
          detail: '',
          modal: false,
        },
        { title: 'Open Settings' },
        { title: 'Open Logs' },
        { title: 'More Info' },
      )
      .then(async (choice) => {
        if (choice === undefined) {
          return;
        }

        switch (choice.title) {
          case 'Open Logs':
            this.outputChannel.show();
            break;
          case 'Open Settings':
            await vscode.commands.executeCommand('workbench.action.openSettings', '@ext:hashicorp.terraform');
            break;
          case 'More Info':
            await vscode.commands.executeCommand(
              'vscode.open',
              vscode.Uri.parse('https://github.com/hashicorp/vscode-terraform#troubleshooting'),
            );
            break;
        }
      });

    // Tell VS Code to stop attempting to start
    return CloseAction.DoNotRestart;
  }
}
