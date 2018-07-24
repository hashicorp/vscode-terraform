import * as vscode from 'vscode';
import { Index } from './index';
import { IndexGroup } from './index/group';

class GroupQuickPickItem implements vscode.QuickPickItem {
  description = "";
  detail = "";
  label: string;

  constructor(public group: IndexGroup) {
    this.label = vscode.workspace.asRelativePath(group.uri.toString()).toString();
  }
}

export async function groupQuickPick(index: Index, placeHolder?: string): Promise<IndexGroup> {
  if (index.groups.length === 0)
    return undefined;

  if (index.groups.length === 1)
    return index.groups[0];

  let picks = index.groups.map(g => new GroupQuickPickItem(g));
  let pick = await vscode.window.showQuickPick(picks, {
    placeHolder: placeHolder
  });
  if (!pick)
    return undefined;

  return pick.group;
}