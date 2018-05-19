import * as vscode from 'vscode';
import { build } from './build';
import { parseHcl } from './hcl-hil';
import { Reference, ReferenceQueryOptions } from './reference';
import { QueryOptions, Section } from './section';

export class FileIndex {
  sections: Section[] = [];
  assignments: Reference[] = [];
  diagnostics: vscode.Diagnostic[] = [];

  constructor(public uri: vscode.Uri) { }

  add(section: Section) {
    this.sections.push(section);
  }

  *query(options?: QueryOptions): IterableIterator<Section> {
    for (let s of this.sections)
      if (s.match(options))
        yield s;
  }

  *queryReferences(options?: ReferenceQueryOptions): IterableIterator<Reference> {
    for (let s of this.sections) {
      for (let r of s.references) {
        if (r.match(options))
          yield r;
      }
    }

    for (let a of this.assignments) {
      if (a.match(options))
        yield a;
    }
  }

  static fromString(uri: vscode.Uri, source: string): [FileIndex, vscode.Diagnostic] {
    let [ast, error] = parseHcl(source);

    let index = ast ? build(uri, ast) : null;

    if (error) {
      let range = new vscode.Range(error.line, error.column, error.line, 300);
      let message = error.message === "" ? "Parse error" : error.message;
      let diagnostic = new vscode.Diagnostic(range, message, vscode.DiagnosticSeverity.Error);

      return [index, diagnostic];
    }

    return [index, null];
  }
}
