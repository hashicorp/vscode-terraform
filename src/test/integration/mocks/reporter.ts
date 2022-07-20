import TelemetryReporter from '@vscode/extension-telemetry';

export const reporter: TelemetryReporter = {
  sendTelemetryEvent: () => undefined,
  sendRawTelemetryEvent: () => undefined,
  sendTelemetryErrorEvent: () => undefined,
  sendTelemetryException: () => undefined,
  dispose: async () => undefined,

  telemetryLevel: 'all',
};
