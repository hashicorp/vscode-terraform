/**
 * Copyright (c) HashiCorp, Inc.
 * SPDX-License-Identifier: MPL-2.0
 */

import {
  ActivityBar,
  BottomBarPanel,
  DefaultTreeSection,
  EditorView,
  InputBox,
  ModalDialog,
  OutputView,
  SideBarView,
  ViewContent,
  ViewTitlePart,
  VSBrowser,
  Workbench,
} from 'vscode-extension-tester';
import * as path from 'path';
import { expect } from 'chai';

describe('HCP tree view tests', () => {
  let titlePart: ViewTitlePart;
  let content: ViewContent;
  let workbench: Workbench;
  let workspaceTree: DefaultTreeSection;
  let runTree: DefaultTreeSection;
  let bottomBar: BottomBarPanel;
  let outputView: OutputView;

  before(async function () {
    await VSBrowser.instance.openResources(path.join('src', 'test', 'fixtures'));

    (await new ActivityBar().getViewControl('HCP Terraform'))?.openView();

    const view = new SideBarView();
    titlePart = view.getTitlePart();
    content = view.getContent();

    workbench = new Workbench();

    bottomBar = new BottomBarPanel();
    await bottomBar.toggle(true);
    outputView = await bottomBar.openOutputView();
  });

  it('should have correct title', async () => {
    const title = await titlePart.getTitle();
    expect(title.toLowerCase()).equals('hcp terraform');
  });

  it('should login', async () => {
    await workbench.executeCommand('HCP Terraform: Login');

    const dialog = new ModalDialog();
    const buttons = await dialog.getButtons();
    expect(buttons.length).equals(2);
    await dialog.pushButton('Allow');

    const input = await InputBox.create();

    // simulate connecting to HCP app.terraform.io
    await input.setText('Default HCP Terraform instance');
    await input.confirm();

    // use the existing token workflow instead of file
    await input.setText('Existing user token');
    await input.confirm();

    // we have mocked the api so the token doesn't matter
    await input.setText('fdsfdsdssfgdgdgdfgdsfagdfagdfrergebvbvtrhge');
    await input.confirm();

    await input.selectQuickPick('Org 1');

    // Enable if you want to see the output channels
    // await logOutputChannels();
  });

  it('should have workspaces', async () => {
    // title should change to Org selected
    workspaceTree = (await content.getSection('Workspace - (Org 1)')) as DefaultTreeSection;
    expect(workspaceTree).is.not.undefined;
    expect(await workspaceTree?.isDisplayed()).is.true;

    const items = await workspaceTree.getVisibleItems();

    const labels = await Promise.all(items.map((item) => item.getLabel()));
    expect(labels).contains('Workspace 1');

    const item = await workspaceTree.findItem('Workspace 1');
    expect(item).not.undefined;

    expect(await item?.getLabel()).equals('Workspace 1');
    expect(await item?.getDescription()).equals('[Project 1]');
    expect(await item?.getTooltip()).equals('Workspace 1 [Project 1]');
  });

  it('should show a run when a workspace is clicked', async () => {
    const item = await workspaceTree.findItem('Workspace 1');
    expect(item).not.undefined;
    await item?.select();
    await item?.click();

    runTree = (await content.getSection('Runs')) as DefaultTreeSection;
    expect(runTree).is.not.undefined;
    expect(await runTree?.isDisplayed()).is.true;

    // wait for the run to load otherwise the test will fail
    await VSBrowser.instance.driver.sleep(500);

    const runItem = await runTree.findItem('Run 1');
    expect(runItem).not.undefined;
    await runItem?.select();
    await runItem?.click();
    expect(await runItem?.getLabel()).equals('Run 1');
    expect(await runItem?.getDescription()).contains('manual');
    expect(await runItem?.getTooltip()).contains('Run 1 manual');
  });

  async function logOutputChannels() {
    // wait a bit for the output channels to be populated
    await VSBrowser.instance.driver.sleep(100);

    const channels = ['MSW Debug Channel', 'HCP Terraform', 'HashiCorp Authentication', 'Extension Host'];
    for (const channel of channels) {
      await outputView.selectChannel(channel);
      console.log(`-------------${channel}---------------------`);
      console.log(await outputView.getText());
      console.log(`-------------${channel}---------------------`);
    }
  }
});
