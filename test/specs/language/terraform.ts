// Copyright (c) The OpenTofu Authors
// SPDX-License-Identifier: MPL-2.0
// Copyright (c) HashiCorp, Inc.
// SPDX-License-Identifier: MPL-2.0

import { StatusBar } from 'wdio-vscode-service';
import { browser, expect } from '@wdio/globals';

import path from 'node:path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function getTestWorkspacePath() {
  return path.join(__dirname, '../../../', 'testFixture');
}

describe('Terraform language tests', () => {
  let statusBar: StatusBar;

  before(async () => {
    const workbench = await browser.getWorkbench();
    statusBar = workbench.getStatusBar();

    const testFile = path.join(getTestWorkspacePath(), `sample.tf`);
    browser.executeWorkbench((vscode, fileToOpen) => {
      vscode.commands.executeCommand('vscode.open', vscode.Uri.file(fileToOpen));
    }, testFile);
  });

  after(async () => {
    // TODO: Close the file
  });

  it('can detect correct language', async () => {
    expect(await statusBar.getCurrentLanguage()).toContain('Terraform');
  });

  // it('can detect terraform version', async () => {
  //   let item: WebdriverIO.Element | undefined;
  //   await browser.waitUntil(
  //     async () => {
  //       const i = await statusBar.getItems();
  //       // console.log(i);

  //       item = await statusBar.getItem(
  //         'Editor Language Status: 0.32.7, Terraform LS, next: 1.6.6, Terraform Installed, next: any, Terraform Required',
  //       );
  //     },
  //     { timeout: 10000, timeoutMsg: 'Did not find a version' },
  //   );

  //   expect(item).toBeDefined();
  // });
});
