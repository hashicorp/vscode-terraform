// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck ignore type checking in test files
import { getLsVersion, isValidVersionString, getRequiredVersionRelease } from '../../installer/detector';
import { exec } from '../../utils';
import { getRelease } from '@hashicorp/js-releases';

jest.mock('../../utils');
jest.mock('@hashicorp/js-releases');

describe('ls detector', () => {
  describe('terraform release detector', () => {
    test('returns valid release', async () => {
      getRelease.mockImplementationOnce(() => {
        return {
          builds: [
            {
              "arch": "amd64",
              "filename": "terraform-ls_0.24.0_windows_amd64.zip",
              "name": "terraform-ls",
              "os": "windows",
              "url": "https://releases.hashicorp.com/terraform-ls/0.24.0/terraform-ls_0.24.0_windows_amd64.zip",
              "version": "0.24.0"
            }
          ],
          name: "terraform-ls",
          shasums: "terraform-ls_0.24.0_SHA256SUMS",
          shasums_signature: "terraform-ls_0.24.0_SHA256SUMS.72D7468F.sig",
          version: "0.24.0"
        };
      });

      const expected = {
        builds: [
          {
            "arch": "amd64",
            "filename": "terraform-ls_0.24.0_windows_amd64.zip",
            "name": "terraform-ls",
            "os": "windows",
            "url": "https://releases.hashicorp.com/terraform-ls/0.24.0/terraform-ls_0.24.0_windows_amd64.zip",
            "version": "0.24.0"
          }
        ],
        name: "terraform-ls",
        shasums: "terraform-ls_0.24.0_SHA256SUMS",
        shasums_signature: "terraform-ls_0.24.0_SHA256SUMS.72D7468F.sig",
        version: "0.24.0"
      };

      const result = await getRequiredVersionRelease('0.24.0', '2.16.0',  '1.66.0');

      expect(result).toStrictEqual(expected);
    });

    test('returns latest if invalid version', async () => {
      getRelease.mockImplementationOnce(() => {
        throw new Error("invalid version");
      }).mockImplementationOnce(() => {
        return {
          builds: [
            {
              "arch": "amd64",
              "filename": "terraform-ls_0.24.0_windows_amd64.zip",
              "name": "terraform-ls",
              "os": "windows",
              "url": "https://releases.hashicorp.com/terraform-ls/0.24.0/terraform-ls_0.24.0_windows_amd64.zip",
              "version": "0.24.0"
            }
          ],
          name: "terraform-ls",
          shasums: "terraform-ls_0.24.0_SHA256SUMS",
          shasums_signature: "terraform-ls_0.24.0_SHA256SUMS.72D7468F.sig",
          version: "0.24.0"
        }
      });

      const expected = {
        builds: [
          {
            "arch": "amd64",
            "filename": "terraform-ls_0.24.0_windows_amd64.zip",
            "name": "terraform-ls",
            "os": "windows",
            "url": "https://releases.hashicorp.com/terraform-ls/0.24.0/terraform-ls_0.24.0_windows_amd64.zip",
            "version": "0.24.0"
          }
        ],
        name: "terraform-ls",
        shasums: "terraform-ls_0.24.0_SHA256SUMS",
        shasums_signature: "terraform-ls_0.24.0_SHA256SUMS.72D7468F.sig",
        version: "0.24.0"
      };

      const result = await getRequiredVersionRelease('10000.24.0', '2.16.0',  '1.66.0');

      expect(result).toStrictEqual(expected);
      expect(getRelease).toBeCalledTimes(2);
    });
  });

  describe('terraform detector', () => {
    let temp;

    beforeEach(() => {
      temp = require('temp').track();
    });

    test('returns valid version with valid path', async () => {
      const installPath = temp.path('foo');
      exec.mockImplementationOnce(() => {
        return {
          stdout: '{"version": "1.2.3"}',
        };
      });
      const result = await getLsVersion(installPath);
      expect(result).toBe('1.2.3');
    });

    test('returns undefined with invalid path', async () => {
      const installPath = temp.path('foo');
      const result = await getLsVersion(installPath);
      expect(result).toBe(undefined);
    });
  });

  describe('version detector', () => {
    beforeEach(() => {});

    test('detect valid version', async () => {
      const result = isValidVersionString('1.2.3');
      expect(result).toBeTruthy();
    });

    test('detect invalid version', async () => {
      const result = isValidVersionString('1f');
      expect(result).toBeFalsy();
    });

    test('detect valid semver version', async () => {
      const result = isValidVersionString('1.2.3-alpha');
      expect(result).toBeTruthy();
    });

    test('detect invalid semver version', async () => {
      const result = isValidVersionString('1.23-alpha');
      expect(result).toBeFalsy();
    });
  });
});
