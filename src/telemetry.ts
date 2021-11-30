import TelemetryReporter from 'vscode-extension-telemetry';
import { BaseLanguageClient, ClientCapabilities, StaticFeature } from 'vscode-languageclient';

import { ExperimentalClientCapabilities } from './types';

const TELEMETRY_VERSION = 1;

type TelemetryEvent = {
  v: number;
  name: string;
  properties: { [key: string]: unknown };
};

export class TelemetryFeature implements StaticFeature {
  constructor(private client: BaseLanguageClient, reporter: TelemetryReporter) {
    this.client.onTelemetry((event: TelemetryEvent) => {
      if (event.v != TELEMETRY_VERSION) {
        console.log(`unsupported telemetry event: ${event}`);
        return;
      }

      reporter.sendRawTelemetryEvent(event.name, event.properties);
    });
  }

  public fillClientCapabilities(capabilities: ClientCapabilities & ExperimentalClientCapabilities): void {
    if (!capabilities['experimental']) {
      capabilities['experimental'] = {};
    }
    capabilities['experimental']['telemetryVersion'] = TELEMETRY_VERSION;
  }

  public initialize(): void {
    return;
  }

  public dispose(): void {
    return;
  }
}
