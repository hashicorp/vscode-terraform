import * as ai from 'applicationinsights';
import * as os from 'os';
import * as vscode from "vscode";
import { getConfiguration } from "./configuration";


class TelemetryReporter extends vscode.Disposable {
  private client: ai.TelemetryClient;
  private userOptIn: boolean = false;
  private disposables: vscode.Disposable[] = [];

  constructor(public extensionId: string, public extensionVersion: string, private aiKey: string) {
    super(() => this.disposables.map((d) => d.dispose()));

    if (!aiKey || aiKey === "")
      return;

    this.updateUserOptIn();
  }

  trackEvent(eventName: string, properties?: { [key: string]: string }, measurements?: { [key: string]: number }) {
    if (!this.userOptIn || !this.client || !eventName) {
      console.log(`terraform.telemetry: Not sending metric ${eventName}`);
      return;
    }

    this.client.trackEvent({
      name: `${this.extensionId}/${eventName}`,
      properties: properties,
      measurements: measurements
    });
  }

  trackException(eventName: string, exception: Error, properties?: { [key: string]: string }, measurements?: { [key: string]: number }) {
    if (!this.userOptIn || !this.client || !exception || !eventName) {
      console.log(`terraform.telemetry: Not sending exception metric ${eventName}/${exception}`);
      return;
    }

    if (!properties)
      properties = {};

    properties.name = `${this.extensionId}/${eventName}`;

    this.client.trackException({
      exception: exception,
      properties: properties,
      measurements: measurements
    });
  }

  dispose(): Promise<any> {
    return new Promise<any>(resolve => {
      if (this.client) {
        this.client.flush({
          callback: () => {
            // all data flushed
            this.client = undefined;
            resolve();
          }
        });
      } else {
        resolve();
      }
    });
  }

  private updateUserOptIn() {
    const globalConfig = vscode.workspace.getConfiguration('telemetry');
    const globalOptIn = globalConfig.get<boolean>('enableTelemetry', true);
    const extensionOptIn = getConfiguration().telemetry.enabled;

    const optIn = globalOptIn && extensionOptIn;
    if (this.userOptIn !== optIn) {
      this.userOptIn = optIn;

      if (this.userOptIn) {
        this.createClient();
      } else {
        this.dispose();
      }
    }
  }

  private createClient() {
    // check if another instance exists
    if (ai.defaultClient) {
      this.client = new ai.TelemetryClient(this.aiKey);
      this.client.channel.setUseDiskRetryCaching(true);
    } else {
      ai.setup(this.aiKey)
        .setAutoCollectConsole(false)
        .setAutoCollectDependencies(false)
        .setAutoCollectExceptions(false)
        .setAutoCollectPerformance(false)
        .setAutoCollectRequests(false)
        .setAutoDependencyCorrelation(false)
        .setUseDiskRetryCaching(true)
        .start();
      this.client = ai.defaultClient;
    }

    this.setCommonProperties();
    this.client.context.tags[this.client.context.keys.sessionId] = vscode.env.sessionId;
    this.client.context.tags[this.client.context.keys.userId] = vscode.env.machineId;
  }

  private setCommonProperties() {
    this.client.commonProperties = {
      'common.os': os.platform(),
      'common.platformversion': (os.release() || '').replace(/^(\d+)(\.\d+)?(\.\d+)?(.*)/, '$1$2$3'),
      'common.extname': this.extensionId,
      'common.extversion': this.extensionVersion,
      'common.vscodemachineid': vscode.env.machineId,
      'common.vscodesessionid': vscode.env.sessionId,
      'common.vscodeversion': vscode.version
    }
  }
}

export let Reporter: TelemetryReporter;

export function activate(ctx: vscode.ExtensionContext) {
  const packageJson = require(ctx.asAbsolutePath('./package.json'));

  const aiKey = require('./constants.json').APPINSIGHTS_KEY;

  Reporter = new TelemetryReporter(`${packageJson.publisher}.${packageJson.name}`, packageJson.version, aiKey);
}

export function deactivate(): Promise<any> {
  return Reporter.dispose();
}