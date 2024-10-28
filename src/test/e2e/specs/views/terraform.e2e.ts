// /**
//  * Copyright (c) HashiCorp, Inc.
//  * SPDX-License-Identifier: MPL-2.0
//  */

// import {
//   ActivityBar,
//   DefaultTreeSection,
//   SideBarView,
//   ViewContent,
//   ViewTitlePart,
//   VSBrowser,
//   Workbench,
// } from 'vscode-extension-tester';
// import * as path from 'path';
// import { expect } from 'chai';

// This works locally but does not in CI
// TODO: investigate why the hcp view works in ci but modules does not
// describe('Terraform tree view tests', () => {
//   let titlePart: ViewTitlePart;
//   let content: ViewContent;
//   let providersView: DefaultTreeSection;
//   let callsView: DefaultTreeSection;

//   before(async function () {
//     await VSBrowser.instance.openResources(path.join('src', 'test', 'fixtures', 'sample.tf'));

//     (await new ActivityBar().getViewControl('Terraform'))?.openView();

//     const view = new SideBarView();
//     titlePart = view.getTitlePart();
//     content = view.getContent();
//   });

//   it('should have correct title', async () => {
//     const title = await titlePart.getTitle();
//     expect(title.toLowerCase()).equals('hashicorp terraform');
//   });

//   it('should have provider calls', async () => {
//     providersView = (await content.getSection('Providers')) as DefaultTreeSection;
//     expect(providersView).is.not.undefined;
//     expect(await providersView?.isDisplayed()).is.true;

//     const items = await providersView.getVisibleItems();

//     const labels = await Promise.all(items.map((item) => item.getLabel()));
//     expect(labels).contains('hashicorp/google');

//     const item = await providersView.findItem('-/vault');
//     expect(item).not.undefined;

//     expect(await item?.getLabel()).equals('-/vault');
//     expect(await item?.getTooltip()).equals('registry.terraform.io/-/vault ');
//   });

//   it('should have module calls', async () => {
//     callsView = (await content.getSection('Module Calls')) as DefaultTreeSection;
//     expect(callsView).is.not.undefined;
//     expect(await callsView?.isDisplayed()).is.true;

//     const items = await callsView.getVisibleItems();

//     const labels = await Promise.all(items.map((item) => item.getLabel()));
//     expect(labels).contains('compute');

//     const item = await callsView.findItem('local');
//     expect(item).not.undefined;

//     expect(await item?.getLabel()).equals('local');
//     expect(await item?.getTooltip()).equals('./modules');
//   });
// });
