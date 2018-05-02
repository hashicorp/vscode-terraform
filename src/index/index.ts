
import * as vscode from 'vscode';
import * as minimatch from 'minimatch';

import { build } from './build';
import { parseHcl, ParseError } from './hcl-hil';
import { ErrorDiagnosticCollection } from '../extension';
import { AstItem } from './ast';

export interface QueryOptions {
    name?: string;
    section_type?: string;
    type?: string;
    name_position?: vscode.Position;
    position?: vscode.Position;
}

export interface ReferenceQueryOptions {
    target?: string | Section;
    position?: vscode.Position;
}

function getKind(sectionType: string): vscode.SymbolKind {
    switch (sectionType) {
        case "resource": return vscode.SymbolKind.Interface;
        case "output": return vscode.SymbolKind.Property;
        case "variable": return vscode.SymbolKind.Variable;
    }

    return null;
}

export class Section extends vscode.SymbolInformation {
    references: Reference[] = [];

    // variable, resource or data (for example)
    readonly sectionType: string;

    // optional: but might for example be "aws_s3_bucket"
    readonly type?: string;
    readonly typeLocation?: vscode.Location;
    readonly name: string;
    readonly nameLocation: vscode.Location;
    readonly location: vscode.Location;
    readonly node: AstItem;

    constructor(
        sectionType: string,
        type: string | null,
        typeLocation: vscode.Location | null,
        name: string,
        nameLocation: vscode.Location,
        location: vscode.Location,
        node: AstItem) {
        super(name, getKind(sectionType), "", location)

        this.sectionType = sectionType;
        this.type = type;
        this.typeLocation = typeLocation;
        this.name = name;
        this.nameLocation = nameLocation;
        this.location = location;
        this.node = node;
    }

    match(options?: QueryOptions): boolean {
        if (!options)
            return true;

        if (options.section_type && this.sectionType !== options.section_type)
            return false;

        if (this.type) {
            if (options.type && !this.type.match(options.type))
                return false;
        } else {
            if (options.type)
                return false;
        }

        if (options.name && !this.name.match(options.name))
            return false;

        if (options.name_position && !this.nameLocation.range.contains(options.name_position))
            return false;

        if (options.position && !this.location.range.contains(options.position))
            return false;

        return true;
    }

    id(rename?: string): string {
        let name = rename || this.name;

        if (this.sectionType === "variable") {
            return `var.${name}`;
        }

        if (this.sectionType === "data")
            return [this.sectionType, this.type, name].join(".");

        if (this.sectionType === "output")
            return this.name;

        return [this.type, name].join(".");
    }
}

export class Reference {
    readonly type: string;
    readonly parts: string[];
    readonly location: vscode.Location;
    readonly targetId: string;
    readonly section: Section;

    constructor(expr: string, location: vscode.Location, section: Section) {
        let parts = expr.split('.');

        this.type = (parts[0] === "var") ? "variable" : parts[0];
        this.parts = parts.slice(1);

        this.location = location;
        this.section = section;

        if (this.type === "variable") {
            this.targetId = `var.${this.parts[0]}`;
        } else if (this.type === "data") {
            this.targetId = `data.${this.parts[0]}.${this.parts[1]}`;
        } else {
            this.targetId = `${this.type}.${this.parts[0]}`;
        }
    }

    match(options?: ReferenceQueryOptions): boolean {
        if (!options)
            return true;

        if (options.target) {
            let targetId = options.target instanceof Section ? options.target.id() : options.target;
            if (targetId !== this.targetId)
                return false;
        }

        if (options.position && !this.location.range.contains(options.position)) {
            return false;
        }

        return true;
    }

    getQuery(): QueryOptions {
        if (this.type === "variable") {
            return {
                section_type: this.type,
                name: this.parts[0]
            }
        }

        if (this.type === "data") {
            return {
                section_type: this.type,
                type: this.parts[0],
                name: this.parts[1]
            }
        }

        if (this.type === "module") {
            // TODO: actually parse modules correctly, which will also
            //   allow us to handle these references correctly
            return {
                section_type: this.type,
                name: this.parts[0]
            }
        }

        // assume resource
        return {
            section_type: "resource",
            type: this.type,
            name: this.parts[0]
        }
    }
}

export class FileIndex {
    sections: Section[] = [];

    constructor(public uri: vscode.Uri) { }

    add(section: Section) {
        this.sections.push(section);
    }

    *query(options?: QueryOptions): IterableIterator<Section> {
        for (let s of this.sections)
            if (s.match(options))
                yield s;
    }
}

export interface IndexOptions {
    exclude?: string[];
};

export class Index {
    private Files = new Map<string, FileIndex>();
    private Sections = new Map<string, Section>();

    private eventEmitter = new vscode.EventEmitter<void>();
    onDidChange = this.eventEmitter.event;

    constructor(...indices: FileIndex[]) {
        indices.map((i) => this.add(i));
    }

    add(index: FileIndex) {
        this.Files.set(index.uri.toString(), index);

        index.sections.forEach((section) => {
            this.Sections.set(section.id(), section);
        });

        this.eventEmitter.fire();
    }

    delete(uri: vscode.Uri) {
        let index = this.get(uri);
        if (index) {
            index.sections.forEach((section) => {
                this.Sections.delete(section.id());
            })
        }

        this.Files.delete(uri.toString());
        this.eventEmitter.fire();
    }

    clear(silent: boolean = true) {
        this.Files.clear();
        this.Sections.clear();
        if (!silent)
            this.eventEmitter.fire();
    }

    get(uri: vscode.Uri): FileIndex | null {
        return this.Files.get(uri.toString());
    }

    query(uri: "ALL_FILES" | vscode.Uri, options?: QueryOptions): Section[] {
        if (options && (options.name_position || options.position) && uri === "ALL_FILES") {
            throw "Cannot use ALL_FILES when querying for position or name_position";
        }

        let uris = uri === "ALL_FILES" ? [...this.Files.keys()] : [uri.toString()];

        let indices = uris.map((u) => this.Files.get(u)).filter((i) => i != null);

        return indices.reduce((a, i) => a.concat(...i.query(options)), new Array<Section>());
    }

    queryReferences(uri: "ALL_FILES" | vscode.Uri, options?: ReferenceQueryOptions): Reference[] {
        if (options.position && uri === "ALL_FILES") {
            throw "Cannot use ALL_FILES when querying for position";
        }

        return [].concat(...this.query(uri).map((s) => s.references.filter((r) => r.match(options))));
    }

    getOrIndexDocument(document: vscode.TextDocument, options: IndexOptions = {}): FileIndex {
        let index = this.get(document.uri);
        if (index) {
            return index;
        }

        return this.indexDocument(document, options);
    }

    indexDocument(document: vscode.TextDocument, options: IndexOptions = {}): FileIndex {
        if (options.exclude) {
            let path = vscode.workspace.asRelativePath(document.uri).replace('\\', '/');
            let matches = options.exclude.map((pattern) => {
                return minimatch(path, pattern);
            });
            if (matches.some((v) => v)) {
                // ignore
                return;
            }
        }

        let [ast, error] = parseHcl(document.getText());
        if (error) {
            let range = new vscode.Range(error.line, error.column, error.line, 300);
            let message = error.message === "" ? "Parse error" : error.message;
            let diagnostics = new vscode.Diagnostic(range, message, vscode.DiagnosticSeverity.Error);

            ErrorDiagnosticCollection.set(document.uri, [diagnostics]);

            return null;
        }

        ErrorDiagnosticCollection.set(document.uri, []);

        let index = build(document.uri, ast);
        this.add(index);
        return index;
    }
}
