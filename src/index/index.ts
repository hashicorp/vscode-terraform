import { FileIndex } from "./file-index";
import { IndexGroup } from "./group";
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

    /// Returns the group with the specified Uri
    group(uri: Uri | string): IndexGroup {
        const s = uri.toString();
        return this._groups.get(s);
    }

    /// Returns the group to which the specified uri would belong
    groupFor(uri: Uri | FileIndex): IndexGroup {
        return this.groups.find(g => g.belongs(uri));
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
