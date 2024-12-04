// /**
//  * Copyright (c) HashiCorp, Inc.
//  * SPDX-License-Identifier: MPL-2.0
//  */

// import { expect } from 'chai';
// import { ArraySetting, CheckboxSetting, SettingsEditor, Workbench } from 'vscode-extension-tester';

// TODO: Come back and investigate why this fails on insiders

// describe('Settings Editor', () => {
//   let settings: SettingsEditor;

//   before(async () => {
//     settings = await new Workbench().openSettings();
//   });

//   it('terraform.languageServer.enable should be true by default', async () => {
//     const setting = await settings.findSetting('Enable', 'Terraform', 'Language Server');

//     const simpleDialogSetting = setting as CheckboxSetting;
//     expect(await simpleDialogSetting.getValue()).is.true;

//     const desc = await simpleDialogSetting.getDescription();
//     expect(desc).contains('Enable Terraform Language Server');
//   });

//   it('terraform.languageServer.args should have serve by default', async () => {
//     const argsSetting = (await settings.findSetting('Args', 'Terraform', 'Language Server')) as ArraySetting;

//     const args = await argsSetting.getValues();
//     expect(args).is.not.empty;
//     expect(args).to.include('serve');

//     expect(await argsSetting.getDescription()).contains('Arguments to pass to language server binary');
//   });
// });
