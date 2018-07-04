import * as vscode from 'vscode';
import { Reporter } from '../telemetry';
import { IndexLocator } from './index-locator';
import { Section } from './section';
import { Uri } from './uri';
import { from_vscode_Position } from './vscode-adapter';

export class ReferenceProvider implements vscode.ReferenceProvider {
  constructor(private indexLocator: IndexLocator) { }

  provideReferences(document: vscode.TextDocument, position: vscode.Position, context: vscode.ReferenceContext): vscode.Location[] {
    let section = this.indexLocator.getIndexForDoc(document).query(Uri.parse(document.uri.toString()), { position: from_vscode_Position(position) })[0];
    if (!section)
      return [];

    let references = this.indexLocator.getIndexForDoc(document).queryReferences("ALL_FILES", { target: section });
    return references.map((r) => {
      const range = new vscode.Range(r.location.range.start.line, r.location.range.start.character,
        r.location.range.end.line, r.location.range.end.character);
      return new vscode.Location(vscode.Uri.parse(r.location.uri.toString()), range);
    });
  }
}

function getSymbolInfo(s: Section): vscode.SymbolInformation {
  const location = new vscode.Location(vscode.Uri.parse(s.location.uri.toString()),
  new vscode.Range(s.location.range.start.line, s.location.range.start.character,
    s.location.range.end.line, s.location.range.end.character));
  const containerName = [s.sectionType, s.type].filter((f) => !!f).join(".");
  return new vscode.SymbolInformation(s.name, getKind(s.sectionType), containerName, location);
}

function getKind(sectionType: string): vscode.SymbolKind {
  switch (sectionType) {
    case "resource": return vscode.SymbolKind.Interface;
    case "output": return vscode.SymbolKind.Property;
    case "variable": return vscode.SymbolKind.Variable;
    case "local": return vscode.SymbolKind.Variable;
  }

  return null;
}

export class DocumentSymbolProvider implements vscode.DocumentSymbolProvider {
  constructor(private indexLocator: IndexLocator) { }

  provideDocumentSymbols(document: vscode.TextDocument): vscode.SymbolInformation[] {
    try {
      const sections = this.indexLocator.getIndexForDoc(document).query(Uri.parse(document.uri.toString()));
      const symbols = sections.map((s) => getSymbolInfo(s));

      Reporter.trackEvent("provideDocumentSymbols", {}, { symbolCount: symbols.length });
      return symbols;
    } catch (err) {
      Reporter.trackException("provideDocumentSymbols", err);
      throw err;
    }
  }
}

export class WorkspaceSymbolProvider implements vscode.WorkspaceSymbolProvider {
  constructor(private indexLocator: IndexLocator) { }

  provideWorkspaceSymbols(query: string): vscode.SymbolInformation[] {
    try {
      let indices = [...this.indexLocator.allIndices(true)];

      const sections = Array<Section>().concat(...indices.map((i) => i.query("ALL_FILES", { id: query })));
      const symbols = sections.map((s) => getSymbolInfo(s));

      Reporter.trackEvent("provideWorkspaceSymbols", {}, { symbolCount: symbols.length });
      return symbols;
    } catch (err) {
      Reporter.trackException("provideWorkspaceSymbols", err);
      throw err;
    }
  }
}