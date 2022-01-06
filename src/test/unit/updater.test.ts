import * as vscode from 'vscode';
import { updateOrInstall } from '../../installer/updater';
import { reporter } from './mocks/reporter';
import { installTerraformLS } from '../../installer/installer';
import {
  getRequiredVersionRelease as getRequiredVersionReleaseOrig,
  isValidVersionString as isValidVersionStringOrig,
  pathExists as pathExistsOrig,
  getLsVersion as getLsVersionOrig,
} from '../../installer/detector';
import { ServerPath } from '../../serverPath';
import { lsPathMock } from './mocks/serverPath';

jest.mock('../../installer/detector');
jest.mock('../../installer/installer');

const getConfiguration = jest.mocked(vscode.workspace.getConfiguration);
const pathExists = jest.mocked(pathExistsOrig);
const isValidVersionString = jest.mocked(isValidVersionStringOrig);
const getRequiredVersionRelease = jest.mocked(getRequiredVersionReleaseOrig);
const getLsVersion = jest.mocked(getLsVersionOrig);
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
const lsPath: ServerPath & typeof lsPathMock = lsPathMock;

describe('terraform-ls updater', () => {
  describe('should install', () => {
    test('on fresh install', async () => {
      getConfiguration.mockImplementationOnce(() => ({
        get: jest.fn(() => {
          // config('extensions').get<boolean>('autoUpdate', true);
          return true;
        }),
        has: jest.fn(),
        inspect: jest.fn(),
        update: jest.fn(),
      }));

      pathExists
        .mockImplementationOnce(async () => false) // stg not present
        .mockImplementationOnce(async () => false); // prod not present

      isValidVersionString.mockImplementationOnce(() => true);

      getRequiredVersionRelease.mockImplementationOnce(async () => {
        return {
          name: 'foo',
          shasums: '',
          shasums_signature: '',
          version: '',
          builds: [],
          getBuild: jest.fn(),
          download: jest.fn(),
          verify: jest.fn(),
          unpack: jest.fn(),
          calculateFileSha256Sum: jest.fn(),
          downloadSha256Sum: jest.fn(),
        };
      });

      await updateOrInstall('0.24.0', '2.16.0', '1.66.0', lsPath, reporter);

      expect(pathExists).toBeCalledTimes(2);
      expect(installTerraformLS).toBeCalledTimes(1);
      expect(vscode.workspace.getConfiguration).toBeCalledTimes(1);
      expect(lsPath.stgBinPath).toBeCalledTimes(1);
      expect(lsPath.installPath).toBeCalledTimes(1);
    });

    test('ls version not found', async () => {
      getConfiguration.mockImplementationOnce(() => ({
        get: jest.fn(() => {
          // config('extensions').get<boolean>('autoUpdate', true);
          return true;
        }),
        has: jest.fn(),
        inspect: jest.fn(),
        then: jest.fn(),
        update: jest.fn(),
      }));
      pathExists
        .mockImplementationOnce(async () => false) // stg not present
        .mockImplementationOnce(async () => true); // prod present

      isValidVersionString.mockImplementationOnce(() => true);

      getRequiredVersionRelease.mockImplementationOnce(async () => {
        return {
          name: 'terraform-ls',
          version: '0.24.0',
          shasums_signature: '',
          builds: [],
          getBuild: jest.fn(),
          download: jest.fn(),
          verify: jest.fn(),
          unpack: jest.fn(),
          calculateFileSha256Sum: jest.fn(),
          downloadSha256Sum: jest.fn(),
        };
      });

      getLsVersion.mockImplementationOnce(async () => undefined);

      await updateOrInstall('0.24.0', '2.16.0', '1.66.0', lsPath, reporter);

      expect(pathExists).toBeCalledTimes(2);
      expect(installTerraformLS).toBeCalledTimes(1);
    });

    test('with out of date ls', async () => {
      getConfiguration.mockImplementationOnce(() => ({
        get: jest.fn(() => {
          // config('extensions').get<boolean>('autoUpdate', true);
          return true;
        }),
        has: jest.fn(),
        inspect: jest.fn(),
        then: jest.fn(),
        update: jest.fn(),
      }));
      pathExists
        .mockImplementationOnce(async () => false) // stg not present
        .mockImplementationOnce(async () => true); // prod present

      isValidVersionString.mockImplementationOnce(() => {
        return true;
      });

      getRequiredVersionRelease.mockImplementationOnce(async () => {
        return {
          name: 'terraform-ls',
          version: '0.24.0',
          shasums_signature: '',
          builds: [],
          getBuild: jest.fn(),
          download: jest.fn(),
          verify: jest.fn(),
          unpack: jest.fn(),
          calculateFileSha256Sum: jest.fn(),
          downloadSha256Sum: jest.fn(),
        };
      });

      getLsVersion.mockImplementationOnce(async () => '0.23.0');

      await updateOrInstall('0.24.0', '2.16.0', '1.66.0', lsPath, reporter);

      expect(pathExists).toBeCalledTimes(2);
      expect(installTerraformLS).toBeCalledTimes(1);
    });
  });

  describe('should not install', () => {
    test('instead move staging to prod', async () => {
      // this mimics the stging path being present, which should trigger a rename
      pathExists.mockImplementationOnce(async () => true);

      await updateOrInstall('0.24.0', '2.16.0', '1.66.0', lsPath, reporter);

      // expect stg to be renamed to prod
      expect(vscode.workspace.fs.rename).toBeCalledTimes(1);

      expect(vscode.workspace.getConfiguration).toBeCalledTimes(0);
    });

    test('ls present and autoupdate is false', async () => {
      getConfiguration.mockImplementationOnce(() => ({
        get: jest.fn(() => {
          // config('extensions').get<boolean>('autoUpdate', true);
          return false;
        }),
        has: jest.fn(),
        inspect: jest.fn(),
        then: jest.fn(),
        update: jest.fn(),
      }));

      lsPath.installPath.mockImplementationOnce(() => 'installPath');
      lsPath.stgBinPath.mockImplementationOnce(() => 'stgbinpath');

      isValidVersionString.mockImplementationOnce(() => {
        return true;
      });
      pathExists
        .mockImplementationOnce(async () => false) // stg
        .mockImplementationOnce(async () => true); // prod

      await updateOrInstall('0.24.0', '2.16.0', '1.66.0', lsPath, reporter);

      expect(pathExists).toBeCalledTimes(2);
      expect(vscode.workspace.getConfiguration).toBeCalledTimes(1);
      expect(vscode.workspace.fs.rename).toBeCalledTimes(0);
      expect(getRequiredVersionRelease).toBeCalledTimes(0);
    });

    test('invlaid terraform-ls verison', async () => {
      getConfiguration.mockImplementationOnce(() => ({
        get: jest.fn(() => {
          // config('extensions').get<boolean>('autoUpdate', true);
          return true;
        }),
        has: jest.fn(),
        inspect: jest.fn(),
        then: jest.fn(),
        update: jest.fn(),
      }));

      lsPath.installPath.mockImplementationOnce(() => 'installPath');
      lsPath.stgBinPath.mockImplementationOnce(() => 'stgbinpath');

      isValidVersionString.mockImplementationOnce(() => {
        return true;
      });
      pathExists
        .mockImplementationOnce(async () => false) // stg
        .mockImplementationOnce(async () => false); // prod

      getRequiredVersionRelease.mockImplementationOnce(() => {
        throw new Error('wahtever');
      });

      await updateOrInstall('0.24.0', '2.16.0', '1.66.0', lsPath, reporter);

      expect(pathExists).toBeCalledTimes(2);
      expect(getRequiredVersionRelease).toBeCalledTimes(1);
      expect(reporter.sendTelemetryException).toBeCalledTimes(1);
      expect(vscode.workspace.getConfiguration).toBeCalledTimes(1);
      expect(vscode.workspace.fs.rename).toBeCalledTimes(0);
    });

    test('with current ls version', async () => {
      getConfiguration.mockImplementationOnce(() => ({
        get: jest.fn(() => {
          // config('extensions').get<boolean>('autoUpdate', true);
          return true;
        }),
        has: jest.fn(),
        inspect: jest.fn(),
        then: jest.fn(),
        update: jest.fn(),
      }));
      pathExists
        .mockImplementationOnce(async () => false) // stg not present
        .mockImplementationOnce(async () => true); // prod present

      isValidVersionString.mockImplementationOnce(() => true);

      getRequiredVersionRelease.mockImplementationOnce(async () => {
        return {
          name: 'terraform-ls',
          version: '0.24.0',
          shasums_signature: '',
          builds: [],
          getBuild: jest.fn(),
          download: jest.fn(),
          verify: jest.fn(),
          unpack: jest.fn(),
          calculateFileSha256Sum: jest.fn(),
          downloadSha256Sum: jest.fn(),
        };
      });

      getLsVersion.mockImplementationOnce(async () => '0.24.0');

      await updateOrInstall('0.24.0', '2.16.0', '1.66.0', lsPath, reporter);

      expect(pathExists).toBeCalledTimes(2);
      expect(installTerraformLS).toBeCalledTimes(0);
    });
  });
});
