// Copyright (c) The OpenTofu Authors
// SPDX-License-Identifier: MPL-2.0
// Copyright (c) HashiCorp, Inc.
// SPDX-License-Identifier: MPL-2.0
import { browser, expect } from '@wdio/globals';
import { fail } from 'assert';
import { Workbench, SideBarView, ViewSection, ViewControl, WelcomeContentButton } from 'wdio-vscode-service';
import { Key } from 'webdriverio';

let workbench: Workbench;
let terraformViewContainer: SideBarView<unknown>;
let callSection: ViewSection;

describe('TFC ViewContainer', function () {
  this.retries(3);

  beforeEach(async () => {
    workbench = await browser.getWorkbench();
  });

  it('should have TFC viewcontainer', async () => {
    const viewContainers = await workbench.getActivityBar().getViewControls();
    const titles = await Promise.all(viewContainers.map((vc) => vc.getTitle()));
    expect(titles).toContain('HCP Terraform');
  });

  describe('not logged in', () => {
    let terraformViewControl: ViewControl | undefined;

    beforeEach(async () => {
      terraformViewControl = await workbench.getActivityBar().getViewControl('HCP Terraform');
      expect(terraformViewControl).toBeDefined();
      await terraformViewControl?.wait();
      await terraformViewControl?.openView();
      terraformViewContainer = workbench.getSideBar();
    });

    it('should have workspaces view', async () => {
      callSection = await terraformViewContainer.getContent().getSection('WORKSPACES');
      expect(callSection).toBeDefined();

      const welcome = await callSection.findWelcomeContent();

      const text = await welcome?.getTextSections();
      expect(text).toContain('In order to use HCP Terraform features, you need to be logged in');
    });

    it('should have runs view', async () => {
      callSection = await terraformViewContainer.getContent().getSection('RUNS');
      expect(callSection).toBeDefined();
    });
  });

  describe('logged in', () => {
    let terraformViewControl: ViewControl | undefined;

    beforeEach(async () => {
      terraformViewControl = await workbench.getActivityBar().getViewControl('HCP Terraform');
      expect(terraformViewControl).toBeDefined();
      await terraformViewControl?.wait();
      await terraformViewControl?.openView();
      terraformViewContainer = workbench.getSideBar();
    });

    it('should login', async () => {
      callSection = await terraformViewContainer.getContent().getSection('WORKSPACES');
      expect(callSection).toBeDefined();

      const welcome = await callSection.findWelcomeContent();

      const text = await welcome?.getTextSections();
      expect(text).toContain('In order to use HCP Terraform features, you need to be logged in');

      const buttons = await welcome?.getButtons();
      expect(buttons).toHaveLength(1);
      if (!buttons) {
        fail('No buttons found');
      }

      let loginButton: WelcomeContentButton | undefined;
      for (const button of buttons) {
        const buttonText = await button.getTitle();
        if (buttonText.toLowerCase().includes('login')) {
          loginButton = button;
        }
      }
      if (!loginButton) {
        fail("Couldn't find the login button");
      }

      (await loginButton.elem).click();

      // detect modal and click Allow
      browser.keys([Key.Enter]);

      // detect quickpick and select Existing user token
      browser.keys(['ArrowDown', Key.Enter]);

      // TODO: enter token in input box and hit enter

      // TODO: verify you are logged in
    });
  });
});
