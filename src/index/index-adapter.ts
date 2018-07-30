import * as minimatch from 'minimatch';
import * as vscode from "vscode";
import { getConfiguration } from '../configuration';
import { Logger } from '../logger';
import { FileIndex } from "./file-index";
import { IndexGroup } from "./group";
import { Index } from "./index";

export interface IndexChangedEvent {
}

export class IndexAdapter extends vscode.Disposable {
  private logger = new Logger("index-adapter");
  private disposables: vscode.Disposable[] = [];
  public errors: vscode.DiagnosticCollection;

  private _onDidChange = new vscode.EventEmitter<IndexChangedEvent>();
  get onDidChange() {
    return this._onDidChange.event;
  }

  constructor(public index: Index, public excludePaths: string[]) {
    super(() => this.dispose());

    this.disposables.push(vscode.workspace.onDidChangeWorkspaceFolders(this.onDidChangeWorkspaceFolders));
    this.disposables.push(vscode.workspace.onDidChangeConfiguration(this.onDidChangeConfiguration));
    this.errors = vscode.languages.createDiagnosticCollection("terraform-errors");
  }

  dispose() {
    this.errors.dispose();
    this._onDidChange.dispose();
    this.disposables.map(d => d.dispose());
  }

  private onDidChangeWorkspaceFolders(e: vscode.WorkspaceFoldersChangeEvent) {
    // TODO: remove all groups which are part e.removed[]
  }

  private onDidChangeConfiguration(e: vscode.ConfigurationChangeEvent) {
    if (!e.affectsConfiguration("terraform.indexing"))
      return;
    this.excludePaths = getConfiguration().indexing.exclude || [];
  }

  clear() {
    this.index.clear();
    this.errors.clear();

    this._onDidChange.fire({});
  }

  delete(uri: vscode.Uri) {
    this.index.delete(uri);
    this.errors.delete(uri);

    this._onDidChange.fire({});
  }

  indexDocument(document: vscode.TextDocument): [FileIndex, IndexGroup] {
    if (this.excludePaths.length > 0) {
      let path = vscode.workspace.asRelativePath(document.uri).replace('\\', '/');
      let matches = this.excludePaths.map((pattern) => {
        return minimatch(path, pattern);
      });
      if (matches.some((v) => v)) {
        // ignore
        this.logger.debug(`Ignoring document: ${document.uri.toString()}`);
        return [null, null];
      }
    }

    let [index, diagnostic] = FileIndex.fromString(document.uri, document.getText());
    let diagnostics: vscode.Diagnostic[] = [];
    let group: IndexGroup;

    if (diagnostic) {
      const range = new vscode.Range(diagnostic.range.start.line, diagnostic.range.start.character,
        diagnostic.range.end.line, diagnostic.range.end.character);
      diagnostics.push(new vscode.Diagnostic(range, diagnostic.message, vscode.DiagnosticSeverity.Error));  // TODO: actually map severity
    }

    if (index) {
      diagnostics.push(...index.diagnostics.map((d) => {
        const range = new vscode.Range(d.range.start.line, d.range.start.character,
          d.range.end.line, d.range.end.character);
        return new vscode.Diagnostic(range, d.message, vscode.DiagnosticSeverity.Error);  // TODO: actually map severity
      }));
      group = this.index.add(index);
    }

    this.errors.set(document.uri, diagnostics);
    this._onDidChange.fire({});
    return [index, group];
  }
}