/**
 * Copyright IBM Corp. 2016, 2026
 * SPDX-License-Identifier: MPL-2.0
 */

import {
  ActivityBar,
  BottomBarPanel,
  By,
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

// InputBox.locators is protected; subclassing is the supported way to reuse the library's own quick pick locators
class QuickPickLocators extends InputBox {
  static get rowLabel(): By {
    return QuickPickLocators.locators.Input.quickPickLabel;
  }
}

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

    // Dismiss the onboarding overlay by pressing Escape
    const driver = VSBrowser.instance.driver;
    await driver.actions().sendKeys('\uE00C').perform();
    await driver.sleep(500);

    await (await new ActivityBar().getViewControl('HCP Terraform'))?.openView();

    // Wait for the view to be ready
    await VSBrowser.instance.driver.sleep(2000);

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

    /*
    // The org picker has a separator row (organizationPicker.ts). VS Code >= 1.145 renders it as a non-option row,
    // which breaks getQuickPicks()/selectQuickPick(); select by role=option + label instead.

    await VSBrowser.instance.driver.sleep(5000);
    await input.selectQuickPick('Org 1');
    */

    await VSBrowser.instance.driver.wait(
      async () => {
        try {
          for (const row of await input.findElements(By.css('[role="option"]'))) {
            const labels = await row.findElements(QuickPickLocators.rowLabel);
            if (labels.length > 0 && (await labels[0].getText()) === 'Org 1') {
              await row.click();
              return true;
            }
          }
          return false;
        } catch (e) {
          if (e instanceof Error && e.name === 'StaleElementReferenceError') {
            return false;
          }
          throw e;
        }
      },
      15000,
      'Org 1 never appeared in the quick pick',
    );

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
    // CustomTreeItem.getTooltip() now reads the aria-label of the inner label element (just 'Workspace 1');
    // the tree row's own aria-label holds label, description and tooltip text
    expect(await item?.getAttribute('aria-label')).contains('Workspace 1 [Project 1]');
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
    expect(await runItem?.getAttribute('aria-label')).contains('Run 1 manual');
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
