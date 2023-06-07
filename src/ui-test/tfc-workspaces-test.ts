/**
 * Copyright (c) HashiCorp, Inc.
 * SPDX-License-Identifier: MPL-2.0
 */

import { expect } from 'chai';
import {
  ActivityBar,
  CustomTreeSection,
  InputBox,
  ModalDialog,
  SideBarView,
  ViewContent,
  ViewTitlePart,
  WelcomeContentSection,
} from 'vscode-extension-tester';

import { server } from '../test/integration/mocks/server';
import { apiClient, tokenPluginId } from '../terraformCloud';

export async function mochaGlobalSetup() {
  apiClient.eject(tokenPluginId);

  server.listen();
  console.log(`server running on port x`);
}

export async function mochaGlobalTeardown() {
  server.close();
}

describe('Terraform Cloud View', () => {
  let titlePart: ViewTitlePart;
  let content: ViewContent;

  before(async () => {
    // make sure the view is open
    (await new ActivityBar().getViewControl('HashiCorp Terraform Cloud'))?.openView();

    // now to initialize the view
    // this object is basically just a container for two parts: title & content
    const view = new SideBarView();
    titlePart = view.getTitlePart();
    content = view.getContent();
  });

  it('has the correct title', async () => {
    const title = await titlePart.getTitle();
    expect(title.toLowerCase()).equals('hashicorp terraform cloud');
  });

  describe('Workspaces', () => {
    // the content part is split into an arbitrary number of sections
    // each section may have a different layout
    let workspaces: CustomTreeSection;
    let runs: CustomTreeSection;

    before(async () => {
      workspaces = (await content.getSection('Workspaces')) as CustomTreeSection;
      // workspaces = (await content.getSections())[0] as CustomTreeSection;
      runs = (await content.getSections())[1] as CustomTreeSection;
    });

    it('should display a list of workspaces', async () => {
      const items = await workspaces.getVisibleItems();

      const labels = await Promise.all(items.map((item) => item.getLabel()));
      expect(labels).contains('test-folder');
      expect(labels).contains('test-file');
    });

    it('should display a welcome button', async () => {
      const welcome = await workspaces.findWelcomeContent();
      const buttons = await welcome?.getButtons();

      // Check login button
      const loginButton = buttons![0];
      const text = await loginButton.getText();
      expect(text).equals('Login to Terraform Cloud');

      // Trigger login
      await new Promise((c) => setTimeout(c, 1000));

      await loginButton.click();

      await new Promise((c) => setTimeout(c, 1000));
      const dialog = new ModalDialog();
      // const message = await dialog.getMessage();
      // console.log('🚀 ~ file: tfc-workspaces-test.ts:61 ~ it ~ message:', message);

      await dialog.submit();
      await new Promise((c) => setTimeout(c, 1000));

      const input = await InputBox.create();
      await input.setText('TOKEN');
    });
  });
});
