import * as vscode from 'vscode';
import { FormattingEditProvider } from './format';
import { validateCommand } from './validate';
import { lintCommand } from './lint';
import { liveIndex } from './live';
import { initializeIndex } from './index';

export let errorDiagnosticCollection = vscode.languages.createDiagnosticCollection("terraform-error");
export let outputChannel = vscode.window.createOutputChannel("Terraform");

export function activate(ctx: vscode.ExtensionContext) {
    ctx.subscriptions.push(errorDiagnosticCollection);

    vscode.languages.registerDocumentFormattingEditProvider('terraform', new FormattingEditProvider);

    ctx.subscriptions.push(vscode.workspace.onDidChangeTextDocument(liveIndex));

    ctx.subscriptions.push(vscode.commands.registerCommand('terraform.validate', () => { validateCommand(); }));
    ctx.subscriptions.push(vscode.commands.registerCommand('terraform.lint', () => { lintCommand(); }));

    // index operations
    initializeIndex(ctx);
}
