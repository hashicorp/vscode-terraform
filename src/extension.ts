import * as vscode from 'vscode';
import { FormatOnSaveHandler } from './format';
import { validateCommand } from './validate';
import { lintCommand } from './lint';

export let errorDiagnosticCollection = vscode.languages.createDiagnosticCollection("terraform-error");

export function activate(ctx: vscode.ExtensionContext) {
    ctx.subscriptions.push(errorDiagnosticCollection);

    ctx.subscriptions.push(FormatOnSaveHandler.create());

    ctx.subscriptions.push(vscode.commands.registerCommand('terraform.validate', () => { validateCommand(); }));
    ctx.subscriptions.push(vscode.commands.registerCommand('terraform.lint', () => { lintCommand(); }));
}
