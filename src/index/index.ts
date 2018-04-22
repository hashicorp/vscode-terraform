
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

export class TypedSection extends vscode.SymbolInformation {
    constructor(
        readonly SectionType: string,
        readonly Type: string,
        readonly TypeLocation: vscode.Location,
        readonly Name: string,
        readonly NameLocation: vscode.Location,
        Location: vscode.Location) {
        super(Name, getKind(SectionType), "", Location)
    }

    match(options?: QueryOptions): boolean {
        if (!options)
            return true;

        if (options.section_type && this.SectionType === options.section_type)
            return true;

        if (options.type && this.Type.match(options.type))
            return true;

        if (options.name && this.Name.match(options.name))
            return true;

        return false;
    }
}

export class UntypedSection extends vscode.SymbolInformation {
    constructor(
        readonly sectionType: string,
        name: string,
        readonly nameLocation: vscode.Location,
        location: vscode.Location) {
        super(name, getKind(sectionType), "", location);
    }

    match(options?: QueryOptions): boolean {
        if (!options)
            return true;

        if (options.section_type && this.sectionType === options.section_type)
            return true;

        return options.name && !!this.name.match(options.name);
    }
}

type Section = UntypedSection | TypedSection;

export class FileIndex {
    typedSections: TypedSection[] = [];
    untypedSections: UntypedSection[] = [];

    constructor(public uri: vscode.Uri) { }

    *sections(options?: QueryOptions): IterableIterator<Section> {
        for (let s of this.typedSections)
            if (s.match(options))
                yield s;


        for (let s of this.untypedSections)
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

        return indices.reduce((a, i) => a.concat(...i.sections(options)), new Array<Section>());
    }
}

export let WorkspaceIndex = new Index;