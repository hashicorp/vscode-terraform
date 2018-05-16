import { ExtensionContext } from "vscode";
import TelemetryReporter from "vscode-extension-telemetry";

export interface IReporter {
  sendTelemetryEvent(eventName: string, properties?: { [key: string]: string; }, measures?: { [key: string]: number; }): void;

  dispose(): Promise<any>;
}

class NullReporter implements IReporter {
  sendTelemetryEvent(eventName: string, properties?: { [key: string]: string; }, measures?: { [key: string]: number; }): void {
    console.log(`Not sending event: ${eventName}`, properties, measures);
  }

  dispose(): Promise<any> {
    // do nothing
    return Promise.resolve();
  }
}

export let Reporter: IReporter;

export function activate(ctx: ExtensionContext) {
  const packageJson = require(ctx.asAbsolutePath('./package.json'));
  const aiKey = require('./constants.json').APPINSIGHTS_KEY;
  if (aiKey) {
    Reporter = new TelemetryReporter(`${packageJson.publisher}.${packageJson.name}`, packageJson.version, aiKey);
    ctx.subscriptions.push(Reporter);
  } else {
    Reporter = new NullReporter();
  }
}

export function deactivate(): Promise<any> {
  return Reporter.dispose();
}