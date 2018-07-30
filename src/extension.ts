import * as vscode from 'vscode';
import { CompletionProvider } from './autocompletion/completion-provider';
import { CodeLensProvider } from './codelense';
import { IndexCommand } from './commands';
import { LintCommand } from './commands/lint';
import { NavigateToSectionCommand } from './commands/navigatetosection';
import { PreviewGraphCommand } from './commands/preview';
import { ReindexCommand } from './commands/reindex';
import { ShowReferencesCommand } from './commands/showreferences';
import { ValidateCommand } from './commands/validate';
import { getConfiguration } from './configuration';
import { DefinitionProvider } from './definition';
import { DocumentLinkProvider } from './documentlink';
import { CodeFoldingProvider } from './folding';
import { FormattingEditProvider } from './format';
import { GraphContentProvider } from './graph';
import { HoverProvider } from './hover';
import { Index } from './index';
import { FileSystemWatcher } from './index/crawler';
import { IndexAdapter } from './index/index-adapter';
import { DocumentSymbolProvider, ReferenceProvider, WorkspaceSymbolProvider } from './index/providers';
import { liveIndex } from './live';
import * as logging from './logger';
import { RenameProvider } from './rename';
import { Runner } from './runner';
import * as telemetry from './telemetry';
import { ModuleOverview } from './views/module-overview';

export let outputChannel = vscode.window.createOutputChannel("Terraform");
const logger = new logging.Logger("extension");

const documentSelector: vscode.DocumentSelector = [
    { language: "terraform", scheme: "file" },
    { language: "terraform", scheme: "untitled" }
];

export async function activate(ctx: vscode.ExtensionContext) {
    const start = process.hrtime();

    let indexAdapter = new IndexAdapter(new Index, getConfiguration().indexing.exclude || []);
    ctx.subscriptions.push(indexAdapter);

    telemetry.activate(ctx);
    logging.configure(outputChannel);

    let runner = await Runner.create();

    let formattingProvider = new FormattingEditProvider(runner);
    ctx.subscriptions.push(
        vscode.languages.registerDocumentFormattingEditProvider(documentSelector, formattingProvider)
    );

    let graphProvider = new GraphContentProvider(ctx);
    ctx.subscriptions.push(
        vscode.workspace.registerTextDocumentContentProvider('terraform-graph', graphProvider)
    );

    let watcher: FileSystemWatcher;
    if (vscode.workspace.rootPath && getConfiguration().indexing.enabled) {
        watcher = new FileSystemWatcher(indexAdapter);
        ctx.subscriptions.push(watcher);
    }

    ctx.subscriptions.push(
        // push
        new ValidateCommand(indexAdapter, runner),
        new LintCommand(),
        new ReindexCommand(indexAdapter, watcher),
        new ShowReferencesCommand(indexAdapter),
        new IndexCommand(indexAdapter),
        new PreviewGraphCommand(graphProvider, indexAdapter, runner),
        new NavigateToSectionCommand(indexAdapter),

        // providers
        vscode.languages.registerCompletionItemProvider(documentSelector, new CompletionProvider(indexAdapter), '.', '"', '{', '(', '['),
        vscode.languages.registerDefinitionProvider(documentSelector, new DefinitionProvider(indexAdapter)),
        vscode.languages.registerDocumentSymbolProvider(documentSelector, new DocumentSymbolProvider(indexAdapter)),
        vscode.languages.registerWorkspaceSymbolProvider(new WorkspaceSymbolProvider(indexAdapter)),
        vscode.languages.registerReferenceProvider(documentSelector, new ReferenceProvider(indexAdapter)),
        vscode.languages.registerRenameProvider(documentSelector, new RenameProvider(indexAdapter)),
        vscode.languages.registerHoverProvider(documentSelector, new HoverProvider(indexAdapter)),
        vscode.languages.registerDocumentLinkProvider(documentSelector, new DocumentLinkProvider(indexAdapter)),
        vscode.languages.registerFoldingRangeProvider(documentSelector, new CodeFoldingProvider(indexAdapter)),

        // views
        vscode.window.registerTreeDataProvider('terraform-modules', new ModuleOverview(indexAdapter))
    );

    if (getConfiguration().codelens.enabled) {
        ctx.subscriptions.push(vscode.languages.registerCodeLensProvider(documentSelector, new CodeLensProvider(indexAdapter)));
    }

    // operations which should only work in a local context (as opposed to live-share)
    if (vscode.workspace.rootPath) {
        ctx.subscriptions.push(vscode.workspace.onDidChangeTextDocument((e) => liveIndex(indexAdapter, e)));

        // start to build the index
        if (watcher) {
            await watcher.crawl();
        }
    }

    const elapsed = process.hrtime(start);
    const elapsedMs = elapsed[0] * 1e3 + elapsed[1] / 1e6;
    telemetry.Reporter.trackEvent('activated', {}, { activateTimeMs: elapsedMs });

    // show a warning if erd0s.terraform-autocomplete is installed as it is
    // known to cause issues with this plugin
    if (vscode.extensions.getExtension('erd0s.terraform-autocomplete')) {
        const message =
            "The extension erd0s.terraform-autocomplete is known to cause issues with the Terraform plugin\n" +
            "please refer to https://github.com/mauve/vscode-terraform/issues/102 for more information."
        vscode.window.showInformationMessage(message);
        logger.error(message);
    }
}

export async function deactivate(): Promise<any> {
    logging.configure(null);
    return await telemetry.deactivate();
}