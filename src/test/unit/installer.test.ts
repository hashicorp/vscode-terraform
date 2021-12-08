// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck ignore type checking in test files
import { installTerraformLS } from '../../installer/installer';
import { reporter } from '../../__mocks__/reporter';
import { pathExists } from '../../installer/detector';
import { window } from '../../__mocks__/vscode';

jest.mock('../../installer/detector');
describe('ls installer', () => {
  describe('should install', () => {
    let temp;

    beforeEach(() => {
      temp = require('temp').track();
    });

    test('when valid', async () => {
      const installPath = temp.path('foo');

      const release = {
        getBuild: jest.fn((os: string, arch: string) => {
          return {
            url: 'https://releases.hashicorp.com/terraform-ls/0.24.0/terraform-ls_0.24.0_windows_amd64.zip',
            filename: 'terraform-ls_0.24.0_windows_amd64.zip',
          };
        }),
        download: jest.fn(),
        verify: jest.fn(),
        unpack: jest.fn(),
      };

      pathExists.mockImplementationOnce(() => {
        return true;
      });

      window.withProgress.mockImplementationOnce(() => {
        // how do?
      });

      await installTerraformLS(installPath, release, '2.16.0', '1.60.0', reporter);

      expect(release.getBuild).toBeCalledTimes(1);
      // need to mock window.withProgress to get to these
      // expect(release.download).toBeCalledTimes(1);
      // expect(release.verify).toBeCalledTimes(1);
      // expect(release.unpack).toBeCalledTimes(1);
    });
  });
});
