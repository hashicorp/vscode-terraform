export const reporter = {
  sendTelemetryEvent: jest.fn(),
  sendRawTelemetryEvent: jest.fn(),
  sendTelemetryErrorEvent: jest.fn(),
  sendTelemetryException: jest.fn(),
  dispose: jest.fn(),
};
