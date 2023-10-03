/**
 * Copyright (c) HashiCorp, Inc.
 * SPDX-License-Identifier: MPL-2.0
 */

import { config } from './utils/vscode';

export interface InitializationOptions {
  indexing?: IndexingOptions;
  experimentalFeatures?: ExperimentalFeatures;
  ignoreSingleFileWarning?: boolean;
  terraform?: TerraformOptions;
  validation?: ValidationOptions;
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

export interface ValidationOptions {
  enableEnhancedValidation: boolean;
}

export function getInitializationOptions() {
  /*
    This is basically a set of settings masquerading as a function. The intention
    here is to make room for this to be added to a configuration builder when
    we tackle #791
  */
  const validation = config('terraform').get<ValidationOptions>('validation', {
    enableEnhancedValidation: true,
  });
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
    validation,
    experimentalFeatures,
    ignoreSingleFileWarning,
    terraform,
    ...(rootModulePaths.length > 0 && { rootModulePaths }),
    indexing,
  };

  return initializationOptions;
}
