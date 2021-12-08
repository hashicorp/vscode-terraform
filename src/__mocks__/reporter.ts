// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck ignore type checking in test files
export const reporter = {
  sendTelemetryEvent: jest.fn(),
  sendRawTelemetryEvent: jest.fn(),
  sendTelemetryErrorEvent: jest.fn(),
  sendTelemetryException: jest.fn(),
  dispose: jest.fn(),
};
