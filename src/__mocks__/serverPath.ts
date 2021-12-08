// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck ignore type checking in test files
export const lsPath = {
  installPath: jest.fn(),
  stgInstallPath: jest.fn(),
  legacyBinPath: jest.fn(),
  hasCustomBinPath: jest.fn(),
  binPath: jest.fn(),
  stgBinPath: jest.fn(),
  binName: jest.fn(),
  resolvedPathToBinary: jest.fn(),
};
