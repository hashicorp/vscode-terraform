import * as vscode from 'vscode';
import { FormatOnSaveHandler } from './format';
import { validateCommand } from './validate';

export function activate(ctx: vscode.ExtensionContext) {
    ctx.subscriptions.push(FormatOnSaveHandler.create());

    ctx.subscriptions.push(vscode.commands.registerCommand('terraform.validate', () => {
        validateCommand();
    }));
}
