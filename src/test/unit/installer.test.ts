import { pathExists as pathExistsOrig } from '../../installer/detector';
import { installTerraformLS } from '../../installer/installer';
import { reporter } from './mocks/reporter';
import * as path from 'path';
import * as vscode from 'vscode';
import { Release } from '@hashicorp/js-releases';

const pathExists = jest.mocked(pathExistsOrig);
const withProgress = jest.mocked(vscode.window.withProgress);

jest.mock('../../installer/detector');
describe('terraform-ls installer', () => {
  describe('should install', () => {
    test('when valid version is passed', async () => {
      const expectedBuild = {
        url: 'https://releases.hashicorp.com/terraform-ls/0.24.0/terraform-ls_0.24.0_windows_amd64.zip',
        filename: 'terraform-ls_0.24.0_windows_amd64.zip',
      };

      const expectedRelease: Release = {
        name: 'terraform-ls',
        version: '0.24.0',
        getBuild: jest.fn(() => expectedBuild),
        download: jest.fn(),
        verify: jest.fn(),
        unpack: jest.fn(),
        calculateFileSha256Sum: jest.fn(),
        downloadSha256Sum: jest.fn(),
      };

      pathExists.mockImplementationOnce(async () => true);

      const report = jest.fn();
      const token = {
        isCancellationRequested: false,
        onCancellationRequested: jest.fn(),
      };
      withProgress.mockImplementationOnce(async (_, task) => {
        task({ report }, token);
      });

      const expectedPath = path.resolve('installPath', `terraform-ls_v0.24.0.zip`);
      await installTerraformLS('installPath', expectedRelease, '2.16.0', '1.60.0', reporter);

      expect(expectedRelease.getBuild).toBeCalledTimes(1);
      expect(expectedRelease.getBuild).toBeCalledTimes(1);
      expect(withProgress).toBeCalledTimes(1);
      expect(withProgress).toHaveBeenCalledWith(
        {
          cancellable: false,
          location: vscode.ProgressLocation.Window,
          title: 'Installing terraform-ls',
        },
        expect.any(Function),
      );

      expect(expectedRelease.download).toBeCalledTimes(1);
      expect(expectedRelease.download).toHaveBeenCalledWith(expectedBuild.url, expectedPath, expect.any(String));
      expect(expectedRelease.verify).toBeCalledTimes(1);
      expect(expectedRelease.verify).toHaveBeenCalledWith(expectedPath, expectedBuild.filename);
      expect(expectedRelease.unpack).toBeCalledTimes(1);
      expect(expectedRelease.unpack).toHaveBeenCalledWith('installPath', expectedPath);
      expect(vscode.workspace.fs.delete).toBeCalledTimes(1);
      expect(report).toHaveBeenCalledTimes(4);
    });
  });
});
