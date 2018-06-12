import * as vscode from 'vscode';
import { CompletionProvider } from './autocompletion/completion-provider';
import { CodeLensProvider, showReferencesCommand } from './codelense';
import { getConfiguration } from './configuration';
import { DefinitionProvider } from './definition';
import { DocumentLinkProvider } from './documentlink';
import { FormattingEditProvider } from './format';
import { graphCommand, GraphContentProvider } from './graph';
import { HoverProvider } from './hover';
import { IndexLocator } from './index/index-locator';
import { DocumentSymbolProvider, ReferenceProvider, WorkspaceSymbolProvider } from './index/providers';
import { Section } from './index/section';
import { createWorkspaceWatcher, initialCrawl } from './index/watcher';
import { lintCommand } from './lint';
import { liveIndex } from './live';
import { RenameProvider } from './rename';
import * as telemetry from './telemetry';
import { validateCommand } from './validate';

export let ErrorDiagnosticCollection = vscode.languages.createDiagnosticCollection("terraform-error");
export let outputChannel = vscode.window.createOutputChannel("Terraform");

const documentSelector: vscode.DocumentSelector = [
    { language: "terraform", scheme: "file" },
    { language: "terraform", scheme: "untitled" }
];

export let indexLocator: IndexLocator;

export function activate(ctx: vscode.ExtensionContext) {
    indexLocator = new IndexLocator(ctx);

    telemetry.activate(ctx);

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
            showReferencesCommand(indexLocator.getIndexForSection(section), section);
        }),
        vscode.commands.registerCommand('terraform.reindex', () => {
            for (let index of indexLocator.allIndices(false)) {
                index.clear();
            }
            if (getConfiguration().indexing.enabled) {
                initialCrawl(indexLocator);
            }
        }),
        vscode.commands.registerCommand('terraform.index-document', (uri: vscode.Uri): boolean => {
            let doc = vscode.workspace.textDocuments.find((d) => d.uri.toString() === uri.toString());
            if (!doc) {
                vscode.window.showErrorMessage(`No open document with uri ${uri.toString()} found`);
                return false;
            }

            let index = indexLocator.getIndexForUri(uri);
            return !!index.indexDocument(doc);
        }),
        vscode.commands.registerCommand('terraform.preview-graph', () => {
            graphCommand(indexLocator, graphProvider);
        }),
        vscode.commands.registerCommand('terraform.navigate-to-section', async (args: { workspaceFolderName: string, targetId: string }) => {
            let folder = vscode.workspace.workspaceFolders.find((f) => f.name === args.workspaceFolderName);
            if (!folder) {
                await vscode.window.showErrorMessage(`Cannot find workspace folder with name ${args.workspaceFolderName}`);
                return;
            }
            let index = indexLocator.getIndexForWorkspaceFolder(folder);
            let section = index.section(args.targetId);
            if (!section) {
                await vscode.window.showErrorMessage(`No section with id ${args.targetId}`);
                return;
            }

            await vscode.window.showTextDocument(section.location.uri, { selection: section.location.range });
        }),

        // providers
        vscode.languages.registerCompletionItemProvider(documentSelector, new CompletionProvider(indexLocator), '.', '"', '{', '(', '['),
        vscode.languages.registerDefinitionProvider(documentSelector, new DefinitionProvider(indexLocator)),
        vscode.languages.registerDocumentSymbolProvider(documentSelector, new DocumentSymbolProvider(indexLocator)),
        vscode.languages.registerWorkspaceSymbolProvider(new WorkspaceSymbolProvider(indexLocator)),
        vscode.languages.registerReferenceProvider(documentSelector, new ReferenceProvider(indexLocator)),
        vscode.languages.registerRenameProvider(documentSelector, new RenameProvider(indexLocator)),
        vscode.languages.registerHoverProvider(documentSelector, new HoverProvider(indexLocator)),
        vscode.languages.registerDocumentLinkProvider(documentSelector, new DocumentLinkProvider(indexLocator))
    );

    if (getConfiguration().codelens.enabled) {
        ctx.subscriptions.push(vscode.languages.registerCodeLensProvider(documentSelector, new CodeLensProvider(indexLocator)));
    }

    // operations which should only work in a local context (as opposed to live-share)
    if (vscode.workspace.rootPath) {
        // we need to manually handle save events otherwise format on autosave does not work
        ctx.subscriptions.push(vscode.workspace.onDidSaveTextDocument((doc) => formattingProvider.onSave(doc)));
        ctx.subscriptions.push(vscode.workspace.onDidChangeTextDocument((e) => liveIndex(indexLocator, e)));

        // start to build the index
        if (getConfiguration().indexing.enabled) {
            ctx.subscriptions.push(createWorkspaceWatcher(indexLocator));
            initialCrawl(indexLocator);
        }
    }

    telemetry.Reporter.trackEvent('activated');
}

export async function deactivate(): Promise<any> {
    return await telemetry.deactivate();
}