import * as vscode from 'vscode';

class UriQuickPickItem implements vscode.QuickPickItem {
    description = "";
    detail = "";

    constructor(public label: string, public uri: vscode.Uri) {

    }
}

export async function uriQuickPick(uris: vscode.Uri[], placeHolder?: string): Promise<vscode.Uri> {
    if (uris.length === 0)
        return undefined;

    if (uris.length === 1)
        return uris[0];

    let picks = uris.map((u) => new UriQuickPickItem(vscode.workspace.asRelativePath(u), u));
    let pick = await vscode.window.showQuickPick(picks, {
        placeHolder: placeHolder
    });
    if (!pick)
        return undefined;

    return pick.uri;
}