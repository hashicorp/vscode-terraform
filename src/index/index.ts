
import * as minimatch from 'minimatch';
import * as vscode from 'vscode';
import { ErrorDiagnosticCollection } from '../extension';
import { FileIndex } from './file-index';
import { Reference, ReferenceQueryOptions } from './reference';
import { QueryOptions, Section } from './section';

export interface IndexOptions {
    exclude?: string[];
};

export interface ProviderInfo {
    name: string;
    alias?: string;
    version: string;
};

export class Index {
    private Files = new Map<string, FileIndex>();
    private Sections = new Map<string, Section>();

    private eventEmitter = new vscode.EventEmitter<void>();
    onDidChange = this.eventEmitter.event;

    constructor(private folder: vscode.WorkspaceFolder, ...indices: FileIndex[]) {
        indices.map((i) => this.add(i));
    }

    get name(): string {
        if (!this.folder)
            return "untitled";

        return this.folder.name;
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

    indices(uri: "ALL_FILES" | vscode.Uri): FileIndex[] {
        if (uri === "ALL_FILES")
            return [...this.Files.values()];
        else {
            const index = this.get(uri);
            if (!index)
                return [];
            return [index];
        }
    }

    get(uri: vscode.Uri): FileIndex | null {
        return this.Files.get(uri.toString());
    }

    section(id: string): Section | null {
        return this.Sections.get(id);
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

        return [].concat(...this.indices(uri).map((f) => [...f.queryReferences(options)]));
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

        let [index, diagnostic] = FileIndex.fromString(document.uri, document.getText());
        let diagnostics: vscode.Diagnostic[] = [];

        if (diagnostic) {
            diagnostics.push(diagnostic);
        }

        if (index) {
            diagnostics.push(...index.diagnostics);
            this.add(index);
        }

        ErrorDiagnosticCollection.set(document.uri, diagnostics);
        return index;
    }

    getProviderDeclarations(): ProviderInfo[] {
        return this.query("ALL_FILES", { section_type: "provider" }).map((s) => {
            return {
                name: s.name,
                alias: s.attributes.get('alias'),
                version: s.attributes.get('version')
            };
        });
    }
}
