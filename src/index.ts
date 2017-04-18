import * as vscode from 'vscode';

import { Parser } from './parser';
import { process } from './process';

import { getConfiguration } from './configuration';
import { errorDiagnosticCollection } from './extension';
import {
  DefinitionProvider, ReferenceProvider, CompletionProvider,
  DocumentSymbolProvider, WorkspaceSymbolProvider,
  RenameProvider
} from './providers';

export function createDiagnostic(error: Parser.ParseError) {
  let range = Parser.locationToRange(error.Location);
  return new vscode.Diagnostic(range, error.Message, vscode.DiagnosticSeverity.Error);
}

class Reference {
  source: vscode.Location;
  target: vscode.Location;
}

class Index {
  private _byUri = new Map<vscode.Uri, Parser.IndexResult>();
  private _variables = new Map<string, vscode.Location>();
  private _outputs = new Map<string, vscode.Location>();
  private _references = new Map<vscode.Uri, Reference[]>();
  private _referencesById = new Map<string, vscode.Location[]>();

  updateUri(uri: vscode.Uri) {
    vscode.workspace.openTextDocument(uri).then((doc) => {
      this.updateDocument(doc);
    });
  }

  updateDocument(doc: vscode.TextDocument) {
    if (doc.languageId != "terraform" || doc.isDirty) {
      console.log("Ignoring document: ", doc.uri.toString);
      return;
    }

    process(doc.getText())
      .then((result) => this.update(doc.uri, result))
      .catch((error) => console.log("Could not parse:", error));
  }

  findDefinition(doc: vscode.TextDocument, pos: vscode.Position): (vscode.Location | null) {
    let references = this._references.get(doc.uri);
    if (references === undefined) {
      return null;
    }

    let reference = references.find((r) => r.source.range.contains(pos));
    if (reference === undefined) {
      return null;
    }

    return reference.target;
  }

  findReferences(targetId: string): vscode.Location[] {
    let references = this._referencesById.get(targetId);
    if (references === undefined) {
      return [];
    }
    return references;
  }

  deleteUri(uri: vscode.Uri) {
    this._byUri.delete(uri);

    this.rebuildVariables();
    this.rebuildReferences();
    errorDiagnosticCollection.delete(uri);
  }

  getVariables(match?: string): string[] {
    return [...this._variables.keys()].filter((v) => v.match(match));
  }

  getOutputs(match?: string): string[] {
    return [...this._outputs.keys()].filter((o) => o.match(match));
  }

  getDocumentSymbols(uri: vscode.Uri, match?: string): vscode.SymbolInformation[] {
    let result = this._byUri.get(uri);
    if (result === undefined) {
      return [];
    }

    return result.Variables.filter((v) => v.Name.match(match)).map((v) => {
      return new vscode.SymbolInformation(v.Name, vscode.SymbolKind.Variable, Parser.locationToRange(v.Location), uri);
    })
      .concat(result.Resources.filter((r) => r.Name.match(match) || r.Type.match(match)).map((r) => {
        return new vscode.SymbolInformation(r.Name, vscode.SymbolKind.Interface, Parser.locationToRange(r.Location), uri, r.Type);
      }))
      .concat(result.Outputs.filter((o) => o.Name.match(match)).map((o) => {
        return new vscode.SymbolInformation(o.Name, vscode.SymbolKind.Property, Parser.locationToRange(o.Location), uri);
      }));
  }

  getSymbols(match: string): vscode.SymbolInformation[] {
    let symbols = [] as vscode.SymbolInformation[];
    for (let uri of this._byUri.keys()) {
      symbols.push(...this.getDocumentSymbols(uri, match));
    }
    return symbols;
  }

  private update(uri: vscode.Uri, result: Parser.IndexResult) {
    console.log("Updating index for ", uri.toString());
    this._byUri.set(uri, result);

    this.rebuildVariables();
    this.rebuildOutputs();
    this.rebuildReferences();
    this.updateDiagnostics(uri, result);
  }

  private rebuildVariables() {
    this._variables.clear();

    for (let [uri, index] of this._byUri) {
      for (let variable of index.Variables) {
        this._variables.set(variable.Name, Parser.locationToLocation(variable.Location, uri));
      }
    }
  }

  private rebuildOutputs() {
    this._outputs.clear();

    for (let [uri, index] of this._byUri) {
      for (let output of index.Outputs) {
        this._outputs.set(output.Name, Parser.locationToLocation(output.Location, uri));
      }
    }
  }

  private rebuildReferences() {
    this._references.clear();
    this._referencesById.clear();

    for (let [uri, index] of this._byUri) {
      let allReferences = [];
      for (let targetId in index.References) {
        if (!this.validTarget(targetId)) {
          continue;
        }

        let reference = index.References[targetId];
        let target = this.findTargetLocation(targetId);
        let references = reference.Locations.map((r): Reference => {
          return {
            source: { uri: uri, range: Parser.locationToRange(r) },
            target: target
          };
        });

        allReferences.push(...references);

        let locations = reference.Locations.map((l) => Parser.locationToLocation(l, uri));
        if (!this._referencesById.has(targetId)) {
          this._referencesById.set(targetId, locations);
        } else {
          this._referencesById.get(targetId).push(...locations);
        }
      }

      if (allReferences.length > 0) {
        this._references.set(uri, allReferences);
      }
    }
  }

  private validTarget(id: string): boolean {
    return this._variables.has(id) || this._outputs.has(id);
  }

  private findTargetLocation(id: string): vscode.Location {
    return this._variables.get(id) || this._outputs.get(id);
  }

  private updateDiagnostics(uri: vscode.Uri, result: Parser.IndexResult) {
    let diagnostics = result.Errors.map(createDiagnostic);
    errorDiagnosticCollection.set(uri, diagnostics);
  }
}

export let index = new Index();

export function createWorkspaceWatcher(): vscode.FileSystemWatcher {
  var watcher = vscode.workspace.createFileSystemWatcher("**/*.{tf,tfvars}");
  watcher.onDidChange((uri) => { index.updateUri(uri) });
  watcher.onDidCreate((uri) => { index.updateUri(uri) });
  watcher.onDidDelete((uri) => { index.deleteUri(uri) });
  return watcher;
}

let initialized = false;

export function initializeIndex(ctx: vscode.ExtensionContext) {
  if (!getConfiguration().indexing.enabled) {
    // listen for enable signal:
    ctx.subscriptions.push(vscode.workspace.onDidChangeConfiguration(() => {
      if (getConfiguration().indexing.enabled && !initialized) {
        initialized = true;
        initializeIndex(ctx);
      }
    }));

    return;
  }

  ctx.subscriptions.push(createWorkspaceWatcher());

  console.log("Scanning for all terraform files...");
  vscode.workspace.findFiles("**/*.{tf,tfvars}", "")
    .then((uris) => {
      console.log("Scanning done.");
      uris.forEach((uri) => index.updateUri(uri));
    }, (error) => {
      console.log("Scanning failed.");
    });

  // register providers which depend on index
  ctx.subscriptions.push(vscode.languages.registerDefinitionProvider("terraform", new DefinitionProvider));
  ctx.subscriptions.push(vscode.languages.registerReferenceProvider("terraform", new ReferenceProvider));
  ctx.subscriptions.push(vscode.languages.registerCompletionItemProvider("terraform", new CompletionProvider, '.', '\"'));
  ctx.subscriptions.push(vscode.languages.registerDocumentSymbolProvider("terraform", new DocumentSymbolProvider));
  ctx.subscriptions.push(vscode.languages.registerWorkspaceSymbolProvider(new WorkspaceSymbolProvider));
  ctx.subscriptions.push(vscode.languages.registerRenameProvider("terraform", new RenameProvider));
}
