import { FileIndex } from "./file-index";
import { IndexGroup } from "./group";
import { Section } from "./section";
import { Uri } from "./uri";


export interface IndexOptions {
    exclude?: string[];
};

export interface ProviderInfo {
    name: string;
    alias?: string;
    version: string;
};

export class Index {
    private _groups = new Map<string, IndexGroup>();

    get groups(): IndexGroup[] {
        return [...this._groups.values()];
    }

    clear() {
        this._groups.forEach(g => g.clear());
        this._groups.clear();
    }

    /// Returns the group with the specified Uri
    group(uri: Uri | string): IndexGroup {
        const s = uri.toString();
        return this._groups.get(s);
    }

    /// Returns the group to which the specified uri would belong
    groupFor(uriOrFileIndexOrSection: Uri | FileIndex | Section): IndexGroup {
        if (uriOrFileIndexOrSection instanceof Section)
            return this.groups.find(g => g.belongs(uriOrFileIndexOrSection.location.uri.dirname()));
        else
            return this.groups.find(g => g.belongs(uriOrFileIndexOrSection));
    }

    add(file: FileIndex): IndexGroup {
        let group = this.group(file.uri.dirname());
        if (!group) {
            group = IndexGroup.createFromFileIndex(file);
            this._groups.set(group.uri.toString(), group);
        } else {
            group.add(file);
        }
        return group;
    }

    delete(uri: Uri | FileIndex): IndexGroup {
        let group = this.groupFor(uri);
        if (!group)
            return group;
        group.delete(uri);
        if (group.fileCount === 0) {
            // remove empty group
            this._groups.delete(group.uri.toString());
        }
    }
}
