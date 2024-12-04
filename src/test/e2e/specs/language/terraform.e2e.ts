/**
 * Copyright (c) HashiCorp, Inc.
 * SPDX-License-Identifier: MPL-2.0
 */

import { StatusBar, VSBrowser } from 'vscode-extension-tester';
import { expect } from 'chai';

import path from 'node:path';

describe('Terraform language tests', () => {
  let statusBar: StatusBar;

  before(async function () {
    this.timeout(15_000);
    statusBar = new StatusBar();
    // most basic functions of status bar are only available when a file is opened
    await VSBrowser.instance.openResources(path.join('src', 'test', 'fixtures', 'sample.tf'));
  });

  it('can detect correct language', async () => {
    // retrieve an item from the status bar by label (the text visible on the bar)
    // we are looking at a tf file, so we can get the language selection item like so
    const item = await statusBar.getItem('Terraform');
    expect(item).not.undefined;

    const language = await statusBar.getCurrentLanguage();
    expect(language).not.undefined;
    expect(language).contains('Terraform');
  });

  // it('can detect terraform version', async () => {
  // or get all the available items
  // const items = await statusBar.getItems();
  // expect(items.length).greaterThan(2);
  // for (const item of items) {
  //   // console.log(await item.getText());
  // }
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
