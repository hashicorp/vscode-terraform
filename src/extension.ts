import * as vscode from 'vscode';
import { FormattingEditProvider } from './format';
import { validateCommand } from './validate';
import { lintCommand } from './lint';
import { liveIndex } from './live';
import { CompletionProvider } from './autocompletion/completion-provider';
import { DefinitionProvider, DocumentSymbolProvider, WorkspaceSymbolProvider, ReferenceProvider, RenameProvider } from './index/providers';
import { initialCrawl, createWorkspaceWatcher } from './index/watcher';
import { Section, Index } from './index';
import { CodeLensProvider, showReferencesCommand } from './codelense';
import { getConfiguration } from './configuration';
import { HoverProvider } from './hover';

export let ErrorDiagnosticCollection = vscode.languages.createDiagnosticCollection("terraform-error");
export let outputChannel = vscode.window.createOutputChannel("Terraform");

const documentSelector: vscode.DocumentSelector = [
    { language: "terraform", scheme: "file" },
    { language: "terraform", scheme: "untitled" }
];

export function activate(ctx: vscode.ExtensionContext) {
    let index = new Index();

    ctx.subscriptions.push(ErrorDiagnosticCollection);

    let formattingProvider = new FormattingEditProvider;
    vscode.languages.registerDocumentFormattingEditProvider(documentSelector, formattingProvider);

    ctx.subscriptions.push(
        // push
        vscode.commands.registerCommand('terraform.validate', () => { validateCommand(); }),
        vscode.commands.registerCommand('terraform.lint', () => { lintCommand(); }),
        vscode.commands.registerCommand('terraform.showReferences', (section: Section) => {
            showReferencesCommand(index, section);
        }),
        vscode.commands.registerCommand('terraform.reindex', () => {
            if (getConfiguration().indexing.enabled) {
                initialCrawl(index);
            }
        }),

        // providers
        vscode.languages.registerCompletionItemProvider(documentSelector, new CompletionProvider(index), '.', '"'),
        vscode.languages.registerDefinitionProvider(documentSelector, new DefinitionProvider(index)),
        vscode.languages.registerDocumentSymbolProvider(documentSelector, new DocumentSymbolProvider(index)),
        vscode.languages.registerWorkspaceSymbolProvider(new WorkspaceSymbolProvider(index)),
        vscode.languages.registerReferenceProvider(documentSelector, new ReferenceProvider(index)),
        vscode.languages.registerRenameProvider(documentSelector, new RenameProvider(index)),
        vscode.languages.registerCodeLensProvider(documentSelector, new CodeLensProvider(index)),
        vscode.languages.registerHoverProvider(documentSelector, new HoverProvider(index))
    );

    // operations which should only work in a local context (as opposed to live-share)
    if (vscode.workspace.rootPath) {
        // we need to manually handle save events otherwise format on autosave does not work
        ctx.subscriptions.push(vscode.workspace.onDidSaveTextDocument((doc) => formattingProvider.onSave(doc)));
        ctx.subscriptions.push(vscode.workspace.onDidChangeTextDocument((e) => liveIndex(index, e)));

        // start to build the index
        if (getConfiguration().indexing.enabled) {
            ctx.subscriptions.push(createWorkspaceWatcher(index));
            initialCrawl(index);
        }
    }
}
