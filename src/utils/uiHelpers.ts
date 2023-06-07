/**
 * Copyright (c) HashiCorp, Inc.
 * SPDX-License-Identifier: MPL-2.0
 */

import * as vscode from 'vscode';

export interface APIResource {
  readonly name: string;

  readonly title: string;
  readonly placeholder: string;

  fetchItems(query?: string): Promise<vscode.QuickPickItem[]>;
}

export class APIQuickPick {
  private quickPick: vscode.QuickPick<vscode.QuickPickItem>;
  private fetchTimerKey: NodeJS.Timeout | undefined;

  constructor(private resource: APIResource) {
    this.quickPick = vscode.window.createQuickPick();
    this.quickPick.title = resource.title;
    this.quickPick.placeholder = resource.placeholder;
    this.quickPick.onDidChangeValue(this.onDidChangeValue, this);
  }

  private onDidChangeValue() {
    clearTimeout(this.fetchTimerKey);
    // Only starts fetching after a user stopped typing for 300ms
    this.fetchTimerKey = setTimeout(() => this.fetchResource.apply(this), 300);
  }

  private async fetchResource() {
    this.quickPick.busy = true;
    this.quickPick.show();

    this.quickPick.items = await this.resource.fetchItems(this.quickPick.value);

    this.quickPick.busy = false;
  }

  async pick() {
    await this.fetchResource();

    const result = await new Promise<vscode.QuickPickItem | undefined>((c) => {
      this.quickPick.onDidAccept(() => c(this.quickPick.selectedItems[0]));
      this.quickPick.onDidHide(() => c(undefined));
      this.quickPick.show();
    });
    this.quickPick.hide();

    return result;
  }
}
