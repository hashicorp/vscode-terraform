import { ExecuteCommandParams, InitializeResult } from 'vscode-languageclient';
import { testFolderPath } from '../../helper';

const initializeResult: InitializeResult = {
  capabilities: {
    executeCommandProvider: {
      commands: ['terraform-ls.module.callers'],
    },
  },
};

/**
 * This should resemble a LanguageClient which can be used in tests.
 * We explicitly cast it to any here, to avoid implementing all 98+ properties.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const client: any = {
  initializeResult,

  onReady: async () => true,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  sendRequest: async (_type: any, params: ExecuteCommandParams) => {
    switch (params.command) {
      case 'terraform-ls.module.callers':
        return { v: 0, moduleCallers: [{ uri: testFolderPath }] };

      default:
        break;
    }
  },
};
