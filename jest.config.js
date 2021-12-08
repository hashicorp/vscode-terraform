/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/src/test/unit/?(*.)+(spec|test).[jt]s?(x)'],
  resetMocks: true,
  clearMocks: true,
  verbose: true,
  silent: true,
  // automock: true,
};
