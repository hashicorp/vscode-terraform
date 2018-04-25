
import * as vscode from 'vscode';
import { build } from './build';
import { parseHcl } from './hcl-hil';

export interface QueryOptions {
    name?: string;
    section_type?: string;
    type?: string;
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
    readonly node: any;

    constructor(
        sectionType: string,
        type: string | null,
        typeLocation: vscode.Location | null,
        name: string,
        nameLocation: vscode.Location,
        location: vscode.Location,
        node: any) {
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

        if (options.section_type && this.sectionType === options.section_type)
            return true;

        if (this.type) {
            if (options.type && this.type.match(options.type))
                return true;
        } else {
            if (options.type)
                return false;
        }

        if (options.name && this.name.match(options.name))
            return true;

        return false;
    }

    id(): string {
        if (this.sectionType === "variable") {
            return `var.${this.name}`;
        }

        if (this.sectionType === "data")
            return [this.sectionType, this.type, this.name].join(".");

        return [this.type, this.name].join(".");
    }
}

export class Reference {
    readonly type: string;
    readonly parts: string[];
    readonly location: vscode.Location;
    readonly targetId: string;

    constructor(expr: string, location: vscode.Location) {
        let parts = expr.split('.');

        this.type = (parts[0] === "var") ? "variable" : parts[0];
        this.parts = parts.slice(1);

        this.location = location;

        if (this.type === "variable") {
            this.targetId = `var.${this.parts[0]}`;
        } else if (this.type === "data") {
            this.targetId = `data.${this.parts[0]}.${this.parts[1]}`;
        } else {
            this.targetId = `${this.type}.${this.parts[0]}`;
        }
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

export class Index {
    private Files = new Map<string, FileIndex>();

    constructor(...indices: FileIndex[]) {
        indices.map((i) => this.add(i));
    }

    add(index: FileIndex) {
        this.Files.set(index.uri.toString(), index);
    }

    delete(uri: vscode.Uri) {
        this.Files.delete(uri.toString());
    }

    get(uri: vscode.Uri): FileIndex | null {
        return this.Files.get(uri.toString());
    }

    query(uri: "ALL_FILES" | vscode.Uri, options?: QueryOptions): Section[] {
        let uris = uri === "ALL_FILES" ? [...this.Files.keys()] : [uri.toString()];

        let indices = uris.map((u) => this.Files.get(u)).filter((i) => i != null);

        return indices.reduce((a, i) => a.concat(...i.query(options)), new Array<Section>());
    }
}

export let WorkspaceIndex = new Index;