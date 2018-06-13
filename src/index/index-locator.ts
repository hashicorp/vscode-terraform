import * as vscode from 'vscode';
import { Index } from '.';
import { Reference } from './reference';
import { Section } from './section';


export class IndexLocator {
    noFolderIndex = new Index(null);
    indices = new Map<vscode.WorkspaceFolder, Index>();

    private changeEvent = new vscode.EventEmitter<void>();

    public get onChanged(): vscode.Event<void> {
        return this.changeEvent.event;
    }

    constructor(ctx: vscode.ExtensionContext) {
        ctx.subscriptions.push(vscode.workspace.onDidChangeWorkspaceFolders((e) => this.onChangeWorkspaceFolders(e)));

        if (vscode.workspace.workspaceFolders) {
            vscode.workspace.workspaceFolders.forEach((folder) => {
                let index = new Index(folder);
                index.onDidChange(() => this.changeEvent.fire());
                this.indices.set(folder, index);
            });
        }
    }

    getIndexForUri(uri: vscode.Uri): Index {
        const folder = vscode.workspace.getWorkspaceFolder(uri);
        if (!folder) {
            return this.noFolderIndex;
        }
        return this.getIndexForWorkspaceFolder(folder);
    }

    getIndexForSection(section: Section): Index {
        return this.getIndexForUri(section.location.uri);
    }

    getIndexForReference(reference: Reference): Index {
        return this.getIndexForUri(reference.location.uri);
    }

    getIndexForWorkspaceFolder(folder: vscode.WorkspaceFolder): Index {
        if (!folder) {
            return this.noFolderIndex;
        }

        if (!this.indices.has(folder)) {
            this.indices.set(folder, new Index(folder));
        }

        return this.indices.get(folder);
    }

    getIndexForDoc(doc: vscode.TextDocument): Index {
        return this.getIndexForUri(doc.uri);
    }

    *allIndices(includeNoFolderIndex: boolean): IterableIterator<Index> {
        if (includeNoFolderIndex)
            yield this.noFolderIndex;

        for (let index of this.indices.values())
            yield index;
    }

    private onChangeWorkspaceFolders(event: vscode.WorkspaceFoldersChangeEvent) {
        event.added.filter((folder) => this.indices.has(folder)).forEach((folder) => this.indices.set(folder, new Index(folder)));

        event.removed.forEach((folder) => this.indices.delete(folder));
    }
}