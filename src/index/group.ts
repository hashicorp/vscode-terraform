import * as path from 'path';
import Uri from 'vscode-uri';
import { FileIndex } from "../../src/index/file-index";
import { QueryOptions, Section } from "../../src/index/section";
import { Reference, ReferenceQueryOptions } from "./reference";

export function dirname(uri: Uri): string {
  return path.dirname(uri.fsPath);
}

export class IndexGroup {
  private files = new Map<string, FileIndex>();
  private sections = new Map<string, Section>();

  constructor(readonly uri: Uri) { }

  public static createFromFileIndex(index: FileIndex): IndexGroup {
    let dir = dirname(index.uri);
    let group = new IndexGroup(Uri.parse(dir));
    group.add(index);
    return group;
  }

  get fileCount(): number {
    return this.files.size;
  }

  get sectionCount(): number {
    return this.sections.size;
  }

  belongs(index: FileIndex | Uri | string): boolean {
    if (typeof index === "string")
      return Uri.parse(index).toString() === this.uri.toString();
    else if (index instanceof Uri)
      return index.toString() === this.uri.toString();
    else {
      const left = this.uri.toString();
      const right = Uri.parse(dirname(index.uri)).toString();
      return left === right;
    }
  }

  add(index: FileIndex) {
    if (!this.belongs(index))
      throw new Error(`Invalid index for group (${this.uri}): ${index.uri.toString()}`);

    this.files.set(index.uri.toString(), index);
    index.sections.forEach(s => this.sections.set(s.id(), s));
  }

  get(uri: Uri): FileIndex | undefined {
    return this.files.get(uri.toString());
  }

  delete(uriOrFileIndex: Uri | FileIndex) {
    const uri = uriOrFileIndex instanceof FileIndex ? uriOrFileIndex.uri : uriOrFileIndex;
    let index = this.get(uri);
    if (!index)
      return;

    index.sections.forEach(s => this.sections.delete(s.id()));
    this.files.delete(uri.toString());
  }

  clear() {
    this.files.clear();
    this.sections.clear();
  }

  query(uri: "ALL_FILES" | Uri, options?: QueryOptions): Section[] {
    if (options && (options.name_position || options.position) && uri === "ALL_FILES") {
      throw "Cannot use ALL_FILES when querying for position or name_position";
    }

    let uris = uri === "ALL_FILES" ? [...this.files.keys()] : [uri.toString()];

    let indices = uris.map((u) => this.files.get(u)).filter((i) => i != null);

    let sections = indices.reduce((a, i) => a.concat(...i.query(options)), new Array<Section>());
    if (options && options.unique) {
      return sections.filter((section, index, self) => {
        return self.findIndex((other) => other.id() === section.id()) === index;
      });
    }
    return sections;
  }

  queryReferences(uri: "ALL_FILES" | Uri, options?: ReferenceQueryOptions): Reference[] {
    if (options.position && uri === "ALL_FILES") {
      throw "Cannot use ALL_FILES when querying for position";
    }

    return [].concat(...this.indices(uri).map((f) => [...f.queryReferences(options)]));
  }

  indices(uri: "ALL_FILES" | Uri): FileIndex[] {
    if (uri === "ALL_FILES")
      return [...this.files.values()];
    else {
      const index = this.get(uri);
      if (!index)
        return [];
      return [index];
    }
  }

  section(id: string): Section | null {
    return this.sections.get(id);
  }
}