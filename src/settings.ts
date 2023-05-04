/**
 * Copyright (c) HashiCorp, Inc.
 * SPDX-License-Identifier: MPL-2.0
 */

import * as vscode from 'vscode';
import { config, deleteSetting, migrate, warnIfMigrate } from './utils/vscode';

export interface InitializationOptions {
  indexing?: IndexingOptions;
  experimentalFeatures?: ExperimentalFeatures;
  ignoreSingleFileWarning?: boolean;
  terraform?: TerraformOptions;
}

export interface TerraformOptions {
  path: string;
  timeout: string;
  logFilePath: string;
}

export interface IndexingOptions {
  ignoreDirectoryNames: string[];
  ignorePaths: string[];
}

export interface ExperimentalFeatures {
  validateOnSave: boolean;
  prefillRequiredFields: boolean;
}

export function getInitializationOptions() {
  /*
    This is basically a set of settings masquerading as a function. The intention
    here is to make room for this to be added to a configuration builder when
    we tackle #791
  */
  const terraform = config('terraform').get<TerraformOptions>('languageServer.terraform', {
    path: '',
    timeout: '',
    logFilePath: '',
  });
  const indexing = config('terraform').get<IndexingOptions>('languageServer.indexing', {
    ignoreDirectoryNames: [],
    ignorePaths: [],
  });
  const ignoreSingleFileWarning = config('terraform').get<boolean>('languageServer.ignoreSingleFileWarning', false);
  const experimentalFeatures = config('terraform').get<ExperimentalFeatures>('experimentalFeatures');

  // deprecated
  const rootModulePaths = config('terraform').get<string[]>('languageServer.rootModules', []);
  if (rootModulePaths.length > 0 && indexing.ignorePaths.length > 0) {
    throw new Error(
      'Only one of rootModules and indexing.ignorePaths can be set at the same time, please remove the conflicting config and reload',
    );
  }

  const initializationOptions: InitializationOptions = {
    experimentalFeatures,
    ignoreSingleFileWarning,
    terraform,
    ...(rootModulePaths.length > 0 && { rootModulePaths }),
    indexing,
  };

  return initializationOptions;
}

export async function migrateLegacySettings(ctx: vscode.ExtensionContext) {
  // User has asked not to check if settings need to be migrated, so return
  if (ctx.globalState.get('terraform.disableSettingsMigration', false)) {
    return;
  }

  // If any of the following list needs to be migrated, ask user if they want
  // to migrate. This is a blunt force approach, but we don't intend to keep
  // checking this forever
  const warnMigration = warnIfMigrate([
    { section: 'terraform', name: 'languageServer.external' },
    { section: 'terraform', name: 'languageServer.pathToBinary' },
    { section: 'terraform-ls', name: 'rootModules' },
    { section: 'terraform-ls', name: 'excludeRootModules' },
    { section: 'terraform-ls', name: 'ignoreDirectoryNames' },
    { section: 'terraform-ls', name: 'terraformExecPath' },
    { section: 'terraform-ls', name: 'terraformExecTimeout' },
    { section: 'terraform-ls', name: 'terraformLogFilePath' },
    { section: 'terraform-ls', name: 'experimentalFeatures' },
  ]);
  if (warnMigration === false) {
    return;
  }

  const messageText =
    'Automatic migration will change your settings file!' +
    '\n\nTo read more about the this change click "More Info" and delay changing anything';
  // Prompt the user if they want to migrate. If the choose no, then return
  // and they are left to migrate the settings themselves.
  // If they choose yes, then automatically migrate the settings
  // Lastly user can be directed to our README for more information about this
  const choice = await vscode.window.showInformationMessage(
    'Terraform Extension settings have moved in the latest update',
    {
      detail: messageText,
      modal: false,
    },
    { title: 'More Info' },
    { title: 'Migrate' },
    { title: 'Open Settings' },
    { title: 'Suppress' },
  );
  if (choice === undefined) {
    return;
  }

  switch (choice.title) {
    case 'Suppress':
      ctx.globalState.update('terraform.disableSettingsMigration', true);
      return;
    case 'Open Settings':
      await vscode.commands.executeCommand('workbench.action.openSettings', '@ext:hashicorp.terraform');
      return;
    case 'More Info':
      await vscode.commands.executeCommand(
        'vscode.open',
        vscode.Uri.parse('https://github.com/hashicorp/vscode-terraform/blob/v2.24.0/docs/settings-migration.md'),
      );
      await migrateLegacySettings(ctx);
      return;
    case 'Migrate':
    // migrate below
  }

  await migrate('terraform', 'languageServer.external', 'languageServer.enable');
  await migrate('terraform', 'languageServer.pathToBinary', 'languageServer.path');

  // We need to move args and ignoreSingleFileWarning out of the JSON object format
  await migrate('terraform', 'languageServer.args', 'languageServer.args');
  await migrate('terraform', 'languageServer.ignoreSingleFileWarning', 'languageServer.ignoreSingleFileWarning');
  await deleteSetting('terraform', 'languageServer');

  // This simultaneously moves terraform-ls to terraform as well as migrate setting names
  await migrate('terraform-ls', 'rootModules', 'languageServer.rootModules');
  await migrate('terraform-ls', 'excludeRootModules', 'languageServer.indexing.ignorePaths');
  await migrate('terraform-ls', 'ignoreDirectoryNames', 'languageServer.indexing.ignoreDirectoryNames');
  await migrate('terraform-ls', 'terraformExecPath', 'languageServer.terraform.path');
  await migrate('terraform-ls', 'terraformExecTimeout', 'languageServer.terraform.timeout');
  await migrate('terraform-ls', 'terraformLogFilePath', 'languageServer.terraform.logFilePath');

  // We need to move prefillRequiredFields and validateOnSave out of the JSON object format as well as
  // move terraform-ls to terraform
  await migrate('terraform-ls', 'experimentalFeatures.validateOnSave', 'experimentalFeatures.validateOnSave');
  await migrate(
    'terraform-ls',
    'experimentalFeatures.prefillRequiredFields',
    'experimentalFeatures.prefillRequiredFields',
  );
  await deleteSetting('terraform-ls', 'experimentalFeatures');
  await vscode.commands.executeCommand('workbench.action.reloadWindow');
}
