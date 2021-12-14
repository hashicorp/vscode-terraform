// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck ignore type checking in test files
import { updateOrInstall } from '../../installer/updater';
import { workspace } from '../../__mocks__/vscode';
import { lsPath } from '../../__mocks__/serverPath';
import { reporter } from './mocks/reporter';
import { installTerraformLS } from '../../installer/installer';
import { getRequiredVersionRelease, isValidVersionString, pathExists,getLsVersion } from '../../installer/detector';

jest.mock('../../installer/detector');
jest.mock('../../installer/installer');

describe('ls updater', () => {
  let temp;

  beforeEach(() => {
    temp = require('temp').track();
  });

  describe('should install', () => {
    test('on fresh install', async () => {
      workspace.getConfiguration.mockImplementationOnce(() => ({
        get: jest.fn(() => {
          // config('extensions').get<boolean>('autoUpdate', true);
          return true;
        }),
      }));
      pathExists
        .mockImplementationOnce(() => {
          return false; // stg not present
        })
        .mockImplementationOnce(() => {
          return false; // prod not present
        });

      isValidVersionString.mockImplementationOnce(() => {
        return true;
      });

      getRequiredVersionRelease.mockImplementationOnce(() => {
        return {
          name: 'foo',
        };
      });

      await updateOrInstall('0.24.0', '2.16.0', '1.66.0', lsPath, reporter);

      expect(pathExists).toBeCalledTimes(2);
      expect(installTerraformLS).toBeCalledTimes(1);
      // expect(workspace.getConfiguration).toBeCalledTimes(1);
      // expect(lsPath.stgBinPath).toBeCalledTimes(1);
      // expect(lsPath.installPath).toBeCalledTimes(1);
    });

    test('ls version not found', async () => {
      workspace.getConfiguration.mockImplementationOnce(() => ({
        get: jest.fn(() => {
          // config('extensions').get<boolean>('autoUpdate', true);
          return true;
        }),
      }));
      pathExists
        .mockImplementationOnce(() => {
          return false; // stg not present
        })
        .mockImplementationOnce(() => {
          return true; // prod present
        });

      isValidVersionString.mockImplementationOnce(() => {
        return true;
      });

      getRequiredVersionRelease.mockImplementationOnce(() => {
        return {
          name: 'terraform-ls',
          version: '0.24.0',
        };
      });

      getLsVersion.mockImplementationOnce(() => {
        return undefined;
      });


      await updateOrInstall('0.24.0', '2.16.0', '1.66.0', lsPath, reporter);

      expect(pathExists).toBeCalledTimes(2);
      expect(installTerraformLS).toBeCalledTimes(1);

    });

    test('with out of date ls', async () => {
      workspace.getConfiguration.mockImplementationOnce(() => ({
        get: jest.fn(() => {
          // config('extensions').get<boolean>('autoUpdate', true);
          return true;
        }),
      }));
      pathExists
        .mockImplementationOnce(() => {
          return false; // stg not present
        })
        .mockImplementationOnce(() => {
          return true; // prod present
        });

      isValidVersionString.mockImplementationOnce(() => {
        return true;
      });

      getRequiredVersionRelease.mockImplementationOnce(() => {
        return {
          name: 'terraform-ls',
          version: '0.24.0',
        };
      });

      getLsVersion.mockImplementationOnce(() => {
        return '0.23.0';
      });


      await updateOrInstall('0.24.0', '2.16.0', '1.66.0', lsPath, reporter);

      expect(pathExists).toBeCalledTimes(2);
      expect(installTerraformLS).toBeCalledTimes(1);
    });
  });

  describe('should not install', () => {
    test('instead move staging to prod', async () => {
      // this mimics the stging path being present, which should trigger a rename
      pathExists.mockImplementationOnce(() => {
        return true;
      });

      await updateOrInstall('0.24.0', '2.16.0', '1.66.0', lsPath, reporter);

      // expect stg to be renamed to prod
      expect(workspace.fs.rename).toBeCalledTimes(1);

      expect(workspace.getConfiguration).toBeCalledTimes(0);
    });

    test('ls present and autoupdate is false', async () => {
      workspace.getConfiguration.mockImplementationOnce(() => ({
        get: jest.fn(() => {
          // config('extensions').get<boolean>('autoUpdate', false);
          return false;
        }),
      }));
      const installPath = temp.path('foo');
      lsPath.installPath.mockImplementationOnce(() => {
        return installPath;
      });
      const stgbinpath = temp.path('foo');
      lsPath.stgBinPath.mockImplementationOnce(() => {
        return stgbinpath;
      });

      isValidVersionString.mockImplementationOnce(() => {
        return true;
      });
      pathExists
        .mockImplementationOnce(() => {
          return false;
        })
        .mockImplementationOnce(() => {
          return true;
        });

      await updateOrInstall('0.24.0', '2.16.0', '1.66.0', lsPath, reporter);

      expect(pathExists).toBeCalledTimes(2);
      expect(workspace.getConfiguration).toBeCalledTimes(1);
      expect(workspace.fs.rename).toBeCalledTimes(0);
      expect(getRequiredVersionRelease).toBeCalledTimes(0);
    });

    test('invlaid terraform-ls verison', async () => {
      workspace.getConfiguration.mockImplementationOnce(() => ({
        get: jest.fn(() => {
          // config('extensions').get<boolean>('autoUpdate', false);
          return true;
        }),
      }));
      const installPath = temp.path('foo');
      lsPath.installPath.mockImplementationOnce(() => {
        return installPath;
      });
      const stgbinpath = temp.path('foo');
      lsPath.stgBinPath.mockImplementationOnce(() => {
        return stgbinpath;
      });

      isValidVersionString.mockImplementationOnce(() => {
        return true;
      });
      pathExists
        .mockImplementationOnce(() => {
          return false;
        })
        .mockImplementationOnce(() => {
          return false;
        });

      getRequiredVersionRelease.mockImplementationOnce(() => {
        throw new Error('wahtever');
      });

      await updateOrInstall('0.24.0', '2.16.0', '1.66.0', lsPath, reporter);

      expect(pathExists).toBeCalledTimes(2);
      expect(getRequiredVersionRelease).toBeCalledTimes(1);
      expect(reporter.sendTelemetryException).toBeCalledTimes(1);
      expect(workspace.getConfiguration).toBeCalledTimes(1);
      expect(workspace.fs.rename).toBeCalledTimes(0);
    });

    test('with current ls version', async () => {
      workspace.getConfiguration.mockImplementationOnce(() => ({
        get: jest.fn(() => {
          // config('extensions').get<boolean>('autoUpdate', true);
          return true;
        }),
      }));
      pathExists
        .mockImplementationOnce(() => {
          return false; // stg not present
        })
        .mockImplementationOnce(() => {
          return true; // prod present
        });

      isValidVersionString.mockImplementationOnce(() => {
        return true;
      });

      getRequiredVersionRelease.mockImplementationOnce(() => {
        return {
          name: 'terraform-ls',
          version: '0.24.0',
        };
      });

      getLsVersion.mockImplementationOnce(() => {
        return '0.24.0';
      });


      await updateOrInstall('0.24.0', '2.16.0', '1.66.0', lsPath, reporter);

      expect(pathExists).toBeCalledTimes(2);
      expect(installTerraformLS).toBeCalledTimes(0);
    });
  });
});
