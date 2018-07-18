import * as vscode from 'vscode';
import { Logger } from '../logger';
import { Reporter } from '../telemetry';
import { IndexLocator } from './index-locator';
import { Property } from './property';
import { Section } from './section';
import { Uri } from './uri';
import { from_vscode_Position, to_vscode_Location, to_vscode_Range } from './vscode-adapter';

export class ReferenceProvider implements vscode.ReferenceProvider {
  private logger = new Logger("reference-provider");

  constructor(private indexLocator: IndexLocator) { }

  provideReferences(document: vscode.TextDocument, position: vscode.Position, context: vscode.ReferenceContext): vscode.Location[] {
    try {
      let section = this.indexLocator.getIndexForDoc(document).query(Uri.parse(document.uri.toString()), { position: from_vscode_Position(position) })[0];
      if (!section)
        return [];

      let references = this.indexLocator.getIndexForDoc(document).queryReferences("ALL_FILES", { target: section });
      return references.map((r) => {
        const range = new vscode.Range(r.location.range.start.line, r.location.range.start.character,
          r.location.range.end.line, r.location.range.end.character);
        return new vscode.Location(vscode.Uri.parse(r.location.uri.toString()), range);
      });
    } catch (error) {
      this.logger.exception("Could not provide references", error);
      Reporter.trackException("provideReferences", error);
      return [];
    }
  }
}

function createDocumentSymbolFromProperty(p: Property): vscode.DocumentSymbol {
  const nameRange = to_vscode_Range(p.nameLocation.range);
  const valueRange = to_vscode_Range(p.valueLocation.range);
  const fullRange = nameRange.union(valueRange);


  if (typeof p.value === "string") {
    return new vscode.DocumentSymbol(
      p.name,
      p.value,
      vscode.SymbolKind.Property,
      fullRange,
      nameRange
    );
  } else {
    let symbol = new vscode.DocumentSymbol(
      p.name,
      "",
      vscode.SymbolKind.Namespace,
      fullRange,
      nameRange
    );
    symbol.children = p.value.map((c) => createDocumentSymbolFromProperty(c));
    return symbol;
  }
}

function createDocumentSymbol(s: Section): vscode.DocumentSymbol {
  const range = to_vscode_Range(s.location.range);
  const selectionRange = to_vscode_Range(s.nameLocation.range);
  const detail = [s.sectionType, s.type].filter((f) => !!f).join(".");

  let symbol = new vscode.DocumentSymbol(s.name, detail, getKind(s.sectionType), range, selectionRange);
  symbol.children = s.properties.map((p) => createDocumentSymbolFromProperty(p));

  // to look at those stupid icons
  // for (let kind = vscode.SymbolKind.File; kind <= vscode.SymbolKind.TypeParameter; kind ++) {
  //   symbol.children.push(new vscode.DocumentSymbol(`${kind}`, `${kind}`, kind, range, selectionRange));
  // }

  return symbol;
}

function createSymbolInfo(s: Section): vscode.SymbolInformation {
  const location = to_vscode_Location(s.location);
  const detail = [s.sectionType, s.type].filter((f) => !!f).join(".");

  return new vscode.SymbolInformation(s.name, getKind(s.sectionType), detail, location);
}

function getKind(sectionType: string): vscode.SymbolKind {
  switch (sectionType) {
    case "resource": return vscode.SymbolKind.Class;
    case "output": return vscode.SymbolKind.Property;
    case "variable": return vscode.SymbolKind.Variable;
    case "local": return vscode.SymbolKind.Variable;
    case "data": return vscode.SymbolKind.String;
  }

  return null;
}

export class DocumentSymbolProvider implements vscode.DocumentSymbolProvider {
  private logger = new Logger("document-symbol-provider");

  constructor(private indexLocator: IndexLocator) { }

  provideDocumentSymbols(document: vscode.TextDocument): vscode.DocumentSymbol[] {
    try {
      const sections = this.indexLocator.getIndexForDoc(document).query(Uri.parse(document.uri.toString()));
      const symbols = sections.map((s) => createDocumentSymbol(s));

      Reporter.trackEvent("provideDocumentSymbols", {}, { symbolCount: symbols.length });
      return symbols;
    } catch (err) {
      this.logger.exception("Could not provide document symbols", err);
      Reporter.trackException("provideDocumentSymbols", err);
      return [];
    }
  }
}

export class WorkspaceSymbolProvider implements vscode.WorkspaceSymbolProvider {
  private logger = new Logger("workspace-symbol-provider");

  constructor(private indexLocator: IndexLocator) { }

  provideWorkspaceSymbols(query: string): vscode.SymbolInformation[] {
    try {
      let indices = [...this.indexLocator.allIndices(true)];

      const sections = Array<Section>().concat(...indices.map((i) => i.query("ALL_FILES", { id: { fuzzy: true, match: query } })));
      const symbols = sections.map((s) => createSymbolInfo(s));

      Reporter.trackEvent("provideWorkspaceSymbols", {}, { symbolCount: symbols.length });
      return symbols;
    } catch (err) {
      this.logger.exception(`Could not provide workspace symbols (query: ${query})`, err);
      Reporter.trackException("provideWorkspaceSymbols", err);
      return [];
    }
  }
}