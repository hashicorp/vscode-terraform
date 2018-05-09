import * as vscode from 'vscode';
import { CompletionProvider } from './autocompletion/completion-provider';
import { CodeLensProvider, showReferencesCommand } from './codelense';
import { getConfiguration } from './configuration';
import { DefinitionProvider } from './definition';
import { DocumentLinkProvider } from './documentlink';
import { FormattingEditProvider } from './format';
import { GraphContentProvider, graphCommand } from './graph';
import { HoverProvider } from './hover';
import { Index, Section } from './index';
import { DocumentSymbolProvider, ReferenceProvider, WorkspaceSymbolProvider } from './index/providers';
import { createWorkspaceWatcher, initialCrawl } from './index/watcher';
import { lintCommand } from './lint';
import { liveIndex } from './live';
import { RenameProvider } from './rename';
import { validateCommand } from './validate';

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
    ctx.subscriptions.push(
        vscode.languages.registerDocumentFormattingEditProvider(documentSelector, formattingProvider)
    );

    let graphProvider = new GraphContentProvider(ctx);
    ctx.subscriptions.push(
        vscode.workspace.registerTextDocumentContentProvider('terraform-graph', graphProvider)
    );

    ctx.subscriptions.push(
        // push
        vscode.commands.registerCommand('terraform.validate', () => { validateCommand(); }),
        vscode.commands.registerCommand('terraform.lint', () => { lintCommand(); }),
        vscode.commands.registerCommand('terraform.showReferences', (section: Section) => {
            showReferencesCommand(index, section);
        }),
        vscode.commands.registerCommand('terraform.reindex', () => {
            index.clear();
            if (getConfiguration().indexing.enabled) {
                initialCrawl(index);
            }
        }),
        vscode.commands.registerCommand('terraform.index-document', (uri: vscode.Uri): boolean => {
            let doc = vscode.workspace.textDocuments.find((d) => d.uri.toString() === uri.toString());
            if (!doc) {
                vscode.window.showErrorMessage(`No open document with uri ${uri.toString()} found`);
                return false;
            }

            return !!index.indexDocument(doc);
        }),
        vscode.commands.registerCommand('terraform.preview-graph', () => {
            graphCommand(index, graphProvider);
        }),
        vscode.commands.registerCommand('terraform.navigate-to-section', async (args: { targetId: string }) => {
            let section = index.section(args.targetId);
            if (!section) {
                await vscode.window.showErrorMessage(`No section with id ${args.targetId}`);
                return;
            }

            await vscode.window.showTextDocument(section.location.uri, { selection: section.location.range });
        }),

        // providers
        vscode.languages.registerCompletionItemProvider(documentSelector, new CompletionProvider(index), '.', '"', '{', '(', '['),
        vscode.languages.registerDefinitionProvider(documentSelector, new DefinitionProvider(index)),
        vscode.languages.registerDocumentSymbolProvider(documentSelector, new DocumentSymbolProvider(index)),
        vscode.languages.registerWorkspaceSymbolProvider(new WorkspaceSymbolProvider(index)),
        vscode.languages.registerReferenceProvider(documentSelector, new ReferenceProvider(index)),
        vscode.languages.registerRenameProvider(documentSelector, new RenameProvider(index)),
        vscode.languages.registerHoverProvider(documentSelector, new HoverProvider(index)),
        vscode.languages.registerDocumentLinkProvider(documentSelector, new DocumentLinkProvider(index))
    );

    if (getConfiguration().codelens.enabled) {
        ctx.subscriptions.push(vscode.languages.registerCodeLensProvider(documentSelector, new CodeLensProvider(index)));
    }

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
