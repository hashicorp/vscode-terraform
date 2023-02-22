/**
 * Copyright (c) HashiCorp, Inc.
 * SPDX-License-Identifier: MPL-2.0
 */

import { exec as execOrg } from '../../utils/helpers';
import { getLsVersion } from '../../installer/detector';

jest.mock('../../utils/helpers');

const exec = jest.mocked(execOrg);

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
