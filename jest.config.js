/**
 * Copyright (c) HashiCorp, Inc.
 * SPDX-License-Identifier: MPL-2.0
 */

/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/src/test/unit/?(*.)+(spec|test).[jt]s?(x)'],
  testPathIgnorePatterns: ['<rootDir>/tests/', '/node_modules/'],
  modulePathIgnorePatterns: ['<rootDir>/out/', '<rootDir>/.vscode-test/'],
  resetMocks: true,
  clearMocks: true,
  verbose: true,
  silent: true,
};
