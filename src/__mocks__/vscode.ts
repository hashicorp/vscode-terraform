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
};

export const workspace = {
  getConfiguration: jest.fn(() => ({
    get: jest.fn(),
  })),
  workspaceFolders: [],
  onDidSaveTextDocument: jest.fn(),
};

export const OverviewRulerLane = {
  Left: null,
};

export const Uri = {
  file: (f: any) => f,
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
};
