export const languages = {
  createDiagnosticCollection: jest.fn(),
};

export const StatusBarAlignment = {};

export const window = {
  createStatusBarItem: jest.fn(() => ({
    show: jest.fn(),
  })),
  showErrorMessage: jest.fn(),
  showWarningMessage: jest.fn(),
  createTextEditorDecorationType: jest.fn(),
  withProgress: jest.fn(),
};

export const workspace = {
  getConfiguration: jest.fn(() => ({
    get: jest.fn(),
  })),
  workspaceFolders: [],
  onDidSaveTextDocument: jest.fn(),
  fs: {
    createDirectory: jest.fn(),
    rename: jest.fn(),
    stat: jest.fn(),
    delete: jest.fn(),
  },
};

export const OverviewRulerLane = {
  Left: null,
};

export const Uri = {
  file: (f: string): string => f,
  parse: jest.fn(),
};
export const Range = jest.fn();
export const Diagnostic = jest.fn();
export const DiagnosticSeverity = { Error: 0, Warning: 1, Information: 2, Hint: 3 };

export const debug = {
  onDidTerminateDebugSession: jest.fn(),
  startDebugging: jest.fn(),
};

export const commands = {
  executeCommand: jest.fn(),
};

export const ProgressLocation = {
  SourceControl: 1,
  Window: 10,
  Notification: 15,
};

export const vscode = {
  languages,
  StatusBarAlignment,
  window,
  workspace,
  OverviewRulerLane,
  Uri,
  Range,
  Diagnostic,
  DiagnosticSeverity,
  debug,
  commands,
  ProgressLocation,
};
