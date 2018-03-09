import * as vscode from 'vscode';
import { FormattingEditProvider } from './format';
import { validateCommand } from './validate';
import { lintCommand } from './lint';
import { liveIndex } from './live';
import { initializeIndex } from './index';
import { CompletionProvider } from './providers';

export let errorDiagnosticCollection = vscode.languages.createDiagnosticCollection("terraform-error");
export let outputChannel = vscode.window.createOutputChannel("Terraform");

export function activate(ctx: vscode.ExtensionContext) {
    ctx.subscriptions.push(errorDiagnosticCollection);

    let formattingProvider = new FormattingEditProvider;

    // we need to manually handle save events otherwise format on autosave does not work
    ctx.subscriptions.push(vscode.workspace.onDidSaveTextDocument((doc) => formattingProvider.onSave(doc)));
    vscode.languages.registerDocumentFormattingEditProvider('terraform', formattingProvider);

    ctx.subscriptions.push(vscode.workspace.onDidChangeTextDocument(liveIndex));

    ctx.subscriptions.push(vscode.commands.registerCommand('terraform.validate', () => { validateCommand(); }));
    ctx.subscriptions.push(vscode.commands.registerCommand('terraform.lint', () => { lintCommand(); }));

    ctx.subscriptions.push(vscode.languages.registerCompletionItemProvider("terraform", new CompletionProvider, '.', '"'));

    // index operations
    initializeIndex(ctx);
}
