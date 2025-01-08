// Copyright (c) The OpenTofu Authors
// SPDX-License-Identifier: MPL-2.0
// Copyright (c) HashiCorp, Inc.
// SPDX-License-Identifier: MPL-2.0

import { browser, expect } from '@wdio/globals';

describe('VS Code Extension Testing', () => {
  it('should be able to load VSCode', async () => {
    const workbench = await browser.getWorkbench();
    expect(await workbench.getTitleBar().getTitle()).toContain('[Extension Development Host]');
  });

  it('should load and install our VSCode Extension', async () => {
    const extensions = await browser.executeWorkbench((vscodeApi) => {
      return vscodeApi.extensions.all;
    });
    expect(extensions.some((extension) => extension.id === 'hashicorp.terraform')).toBe(true);
  });

  it('should show all activity bar items', async () => {
    const workbench = await browser.getWorkbench();
    const viewControls = await workbench.getActivityBar().getViewControls();
    expect(await Promise.all(viewControls.map((vc) => vc.getTitle()))).toEqual([
      'Explorer',
      'Search',
      'Source Control',
      'Run and Debug',
      'Extensions',
      'HashiCorp Terraform',
      'HCP Terraform',
    ]);
  });

  // this does not appear to work in CI
  // it('should start the ls', async () => {
  //   const workbench = await browser.getWorkbench();
  //   await workbench.executeCommand('workbench.panel.output.focus');

  //   const bottomBar = workbench.getBottomBar();
  //   await bottomBar.maximize();

  //   const outputView = await bottomBar.openOutputView();
  //   await outputView.wait();
  //   await outputView.selectChannel('HashiCorp Terraform');
  //   const output = await outputView.getText();

  //   expect(output.some((element) => element.toLowerCase().includes('dispatching next job'.toLowerCase()))).toBeTruthy();
  // });
});
