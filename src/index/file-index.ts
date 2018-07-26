import Uri from 'vscode-uri';
import { build } from './build';
import { Diagnostic, DiagnosticSeverity } from './diagnostic';
import { parseHcl } from './hcl-hil';
import { Position } from './position';
import { Range } from './range';
import { Reference, ReferenceQueryOptions } from './reference';
import { QueryOptions, Section } from './section';
export class FileIndex {
  sections: Section[] = [];
  assignments: Reference[] = [];
  diagnostics: Diagnostic[] = [];

  constructor(public uri: Uri) { }

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

  static fromString(uri: Uri, source: string): [FileIndex, Diagnostic] {
    let [ast, error] = parseHcl(source);

    let index = ast ? build(uri, ast) : null;

    if (error) {
      let range = new Range(new Position(error.line, error.column), new Position(error.line, 300));
      let message = error.message === "" ? "Parse error" : error.message;
      let diagnostic = new Diagnostic(range, message, DiagnosticSeverity.ERROR);

      return [index, diagnostic];
    }

    return [index, null];
  }
}
