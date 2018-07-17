import * as vscode from 'vscode';
import { CompletionProvider } from './autocompletion/completion-provider';
import { CodeLensProvider } from './codelense';
import { getConfiguration } from './configuration';
import { DefinitionProvider } from './definition';
import { DocumentLinkProvider } from './documentlink';
import { FormattingEditProvider } from './format';
import { graphCommand, GraphContentProvider } from './graph';
import { HoverProvider } from './hover';
import { IndexLocator } from './index/index-locator';
import { DocumentSymbolProvider, ReferenceProvider, WorkspaceSymbolProvider } from './index/providers';
import { to_vscode_Range, to_vscode_Uri } from './index/vscode-adapter';
import { createWorkspaceWatcher, initialCrawl } from './index/watcher';
import { LintCommand } from './commands/lint';
import { liveIndex } from './live';
import * as logging from './logger';
import { RenameProvider } from './rename';
import * as telemetry from './telemetry';
import { ValidateCommand } from './commands/validate';
import { ReindexCommand } from './commands/reindex';
import { ShowReferencesCommand } from './commands/showreferences';
import { IndexCommand } from './commands';

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
    logging.configure(outputChannel);

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
        new ValidateCommand(),
        new LintCommand(),
        new ReindexCommand(),
        new ShowReferencesCommand(),
        new IndexCommand(),
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

            await vscode.window.showTextDocument(to_vscode_Uri(section.location.uri), { selection: to_vscode_Range(section.location.range) });
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
    logging.configure(null);
    return await telemetry.deactivate();
}