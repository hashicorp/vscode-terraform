import * as vscode from 'vscode';
import { FormattingEditProvider } from './format';
import { validateCommand } from './validate';
import { lintCommand } from './lint';
import { liveIndex } from './live';
import { CompletionProvider } from './autocompletion/completion-provider';
import { DefinitionProvider, DocumentSymbolProvider, WorkspaceSymbolProvider, ReferenceProvider, RenameProvider } from './index/providers';
import { initialCrawl, createWorkspaceWatcher } from './index/watcher';
import { WorkspaceIndex } from './index';

export let errorDiagnosticCollection = vscode.languages.createDiagnosticCollection("terraform-error");
export let outputChannel = vscode.window.createOutputChannel("Terraform");

const documentSelector: vscode.DocumentSelector = [
    { language: "terraform", scheme: "file" },
    { language: "terraform", scheme: "untitled" }
];

export function activate(ctx: vscode.ExtensionContext) {
    ctx.subscriptions.push(errorDiagnosticCollection);

    let formattingProvider = new FormattingEditProvider;
    vscode.languages.registerDocumentFormattingEditProvider(documentSelector, formattingProvider);

    ctx.subscriptions.push(
        // push
        vscode.commands.registerCommand('terraform.validate', () => { validateCommand(); }),
        vscode.commands.registerCommand('terraform.lint', () => { lintCommand(); }),

        // providers
        vscode.languages.registerCompletionItemProvider(documentSelector, new CompletionProvider, '.', '"'),
        vscode.languages.registerDefinitionProvider(documentSelector, new DefinitionProvider),
        vscode.languages.registerDocumentSymbolProvider(documentSelector, new DocumentSymbolProvider),
        vscode.languages.registerWorkspaceSymbolProvider(new WorkspaceSymbolProvider),
        vscode.languages.registerReferenceProvider(documentSelector, new ReferenceProvider),
        vscode.languages.registerRenameProvider(documentSelector, new RenameProvider)
    );

    // operations which should only work in a local context (as opposed to live-share)
    if (vscode.workspace.rootPath) {
        // we need to manually handle save events otherwise format on autosave does not work
        ctx.subscriptions.push(vscode.workspace.onDidSaveTextDocument((doc) => formattingProvider.onSave(doc)));
        ctx.subscriptions.push(vscode.workspace.onDidChangeTextDocument(liveIndex));

        // start to build the index
        ctx.subscriptions.push(createWorkspaceWatcher(WorkspaceIndex));
        initialCrawl(WorkspaceIndex);
    }
}
