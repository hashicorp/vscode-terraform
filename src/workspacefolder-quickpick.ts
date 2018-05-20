import * as vscode from 'vscode';

class WorkspaceFolderQuickPickItem implements vscode.QuickPickItem {
    description = "";
    detail = "";

    public get label(): string {
        return this.folder.name;
    }

    constructor(public folder: vscode.WorkspaceFolder) {}
}

export interface WorkspaceFolderQuickPickOptions {
    placeHolder?: string;
}

export async function workspaceFolderQuickPick(options: WorkspaceFolderQuickPickOptions = {}): Promise<vscode.WorkspaceFolder> {
    if (vscode.workspace.workspaceFolders.length === 0)
        return undefined;

    if (vscode.workspace.workspaceFolders.length === 1)
        return vscode.workspace.workspaceFolders[0];

    let picks = vscode.workspace.workspaceFolders.map((f) => new WorkspaceFolderQuickPickItem(f));
    let folderPick = await vscode.window.showQuickPick(picks, {
        placeHolder: options.placeHolder
    });
    if (!folderPick)
        return undefined;

    return folderPick.folder;
}