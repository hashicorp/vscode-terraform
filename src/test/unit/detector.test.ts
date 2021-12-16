import { mocked } from 'ts-jest/utils';
import { exec as execOrg } from '../../utils';
import { getRelease as getReleaseOrg, Release } from '@hashicorp/js-releases';
import { getLsVersion, isValidVersionString, getRequiredVersionRelease } from '../../installer/detector';

jest.mock('../../utils');
jest.mock('@hashicorp/js-releases');

const exec = mocked(execOrg);
const getRelease = mocked(getReleaseOrg);

describe('terraform release detector', () => {
  test('returns valid release', async () => {
    const name = 'terraform-ls';
    const shasums = 'terraform-ls_0.24.0_SHA256SUMS';
    const shasums_signature = 'terraform-ls_0.24.0_SHA256SUMS.72D7468F.sig';
    const version = '0.24.0';
    const buildInfo = {
      arch: 'amd64',
      filename: 'terraform-ls_0.24.0_windows_amd64.zip',
      name: 'terraform-ls',
      os: 'windows',
      url: 'https://releases.hashicorp.com/terraform-ls/0.24.0/terraform-ls_0.24.0_windows_amd64.zip',
      version: '0.24.0',
    };

    getRelease.mockImplementationOnce(async () => {
      return {
        builds: [buildInfo],
        name: name,
        shasums: shasums,
        shasums_signature: shasums_signature,
        version: version,
        getBuild: jest.fn(),
        download: jest.fn(),
        verify: jest.fn(),
        unpack: jest.fn(),
        calculateFileSha256Sum: jest.fn(),
        downloadSha256Sum: jest.fn(),
      };
    });

    const expected: Release = {
      builds: [buildInfo],
      name: name,
      shasums: shasums,
      shasums_signature: shasums_signature,
      version: version,
      getBuild: jest.fn(),
      download: jest.fn(),
      verify: jest.fn(),
      unpack: jest.fn(),
      calculateFileSha256Sum: jest.fn(),
      downloadSha256Sum: jest.fn(),
    };

    const result = await getRequiredVersionRelease('0.24.0', '2.16.0', '1.66.0');

    // expect(result).toContainEqual(expected);
    expect(result.builds).toStrictEqual(expected.builds);
    expect(result.name).toBe(expected.name);
    expect(result.shasums).toBe(expected.shasums);
    expect(result.shasums_signature).toBe(expected.shasums_signature);
    expect(result.version).toBe(expected.version);
  });

  test('returns latest if invalid version', async () => {
    const name = 'terraform-ls';
    const shasums = 'terraform-ls_0.24.0_SHA256SUMS';
    const shasums_signature = 'terraform-ls_0.24.0_SHA256SUMS.72D7468F.sig';
    const version = '0.24.0';
    const buildInfo = {
      arch: 'amd64',
      filename: 'terraform-ls_0.24.0_windows_amd64.zip',
      name: 'terraform-ls',
      os: 'windows',
      url: 'https://releases.hashicorp.com/terraform-ls/0.24.0/terraform-ls_0.24.0_windows_amd64.zip',
      version: '0.24.0',
    };

    getRelease
      .mockImplementationOnce(() => {
        throw new Error('invalid version');
      })
      .mockImplementationOnce(async () => {
        return {
          builds: [buildInfo],
          name: name,
          shasums: shasums,
          shasums_signature: shasums_signature,
          version: version,
          getBuild: jest.fn(),
          download: jest.fn(),
          verify: jest.fn(),
          unpack: jest.fn(),
          calculateFileSha256Sum: jest.fn(),
          downloadSha256Sum: jest.fn(),
        };
      });

    const expected = {
      builds: [buildInfo],
      name: name,
      shasums: shasums,
      shasums_signature: shasums_signature,
      version: version,
      getBuild: jest.fn(),
      download: jest.fn(),
      verify: jest.fn(),
      unpack: jest.fn(),
      calculateFileSha256Sum: jest.fn(),
      downloadSha256Sum: jest.fn(),
    };

    const result = await getRequiredVersionRelease('10000.24.0', '2.16.0', '1.66.0');

    expect(result.builds).toStrictEqual(expected.builds);
    expect(result.name).toBe(expected.name);
    expect(result.shasums).toBe(expected.shasums);
    expect(result.shasums_signature).toBe(expected.shasums_signature);
    expect(result.version).toBe(expected.version);
  });
});

describe('terraform detector', () => {
  test('returns valid version with valid path', async () => {
    exec.mockImplementationOnce(async () => {
      return {
        stdout: '{"version": "1.2.3"}',
        stderr: '',
      };
    });
    const result = await getLsVersion('installPath');
    expect(result).toBe('1.2.3');
  });

  test('returns undefined with invalid path', async () => {
    const result = await getLsVersion('installPath');
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
