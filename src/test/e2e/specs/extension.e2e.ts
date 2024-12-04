/**
 * Copyright (c) HashiCorp, Inc.
 * SPDX-License-Identifier: MPL-2.0
 */

import {
  TitleBar,
  ActivityBar,
  ExtensionsViewItem,
  ExtensionsViewSection,
  BottomBarPanel,
} from 'vscode-extension-tester';
import { expect } from 'chai';
import pjson from '../../../../package.json';

describe('VS Code Extension Testing', () => {
  let terraformExtension: ExtensionsViewItem;
  let activityBar: ActivityBar;
  let bottomBarPanel: BottomBarPanel;

  before(async function () {
    this.timeout(15000);
    // open the extensions view
    const view = await (await new ActivityBar().getViewControl('Extensions'))?.openView();
    await view?.getDriver().wait(async function () {
      return (await view.getContent().getSections()).length > 0;
    });

    // we want to find the terraform extension (this project)
    // first we need a view section, best place to get started is the 'Installed' section
    const extensions = (await view?.getContent().getSection('Installed')) as ExtensionsViewSection;

    // search for the extension, you can use any syntax vscode supports for the search field
    // it is best to prepend @installed to the extension name if you don't want to see the results from marketplace
    // also, getting the name directly from package.json seem like a good idea
    await extensions.getDriver().wait(async function () {
      terraformExtension = (await extensions.findItem(`@installed HashiCorp Terraform`)) as ExtensionsViewItem;
      return terraformExtension !== undefined;
    });

    activityBar = new ActivityBar();
    bottomBarPanel = new BottomBarPanel();
  });

  it('Check the extension info', async () => {
    // now we have the extension item, we can check it shows all the fields we want
    const author = await terraformExtension.getAuthor();
    const version = await terraformExtension.getVersion();

    // in this case we are comparing the results against the values in package.json
    expect(author).equals(pjson.publisher);
    expect(version).equals(pjson.version);
  });

  it('should be able to load VSCode', async () => {
    const titleBar = new TitleBar();
    const title = await titleBar.getTitle();
    expect(title).matches(/[Extension Development Host]/);
  });

  it('should show extension activity bar items', async () => {
    const controls = await activityBar.getViewControls();
    expect(controls).not.empty;

    // get titles from the controls
    const titles = await Promise.all(
      controls.map(async (control) => {
        return control.getTitle();
      }),
    );

    // assert a view control named 'Explorer' is present
    // the keyboard shortcut is part of the title, so we do a little transformation
    expect(titles.some((title) => title.startsWith('HCP Terraform'))).is.true;
    expect(titles.some((title) => title.startsWith('HashiCorp Terraform'))).is.true;
  });

  // it('should start the ls', async () => {
  //   const outputView = await bottomBarPanel.openOutputView();
  //   await outputView.wait();
  //   await outputView.selectChannel('HashiCorp Terraform');
  //   await outputView.wait();

  //   const text = await outputView.getText();

  //   expect(text).to.include('Dispatching next job');
  // });
});
