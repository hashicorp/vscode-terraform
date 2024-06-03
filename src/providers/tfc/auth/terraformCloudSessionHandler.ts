import * as vscode from 'vscode';
import TelemetryReporter from '@vscode/extension-telemetry';
import { earlyApiClient } from '../../../api/terraformCloud';
import { isErrorFromAlias, ZodiosError } from '@zodios/core';
import { apiErrorsToString } from '../../../api/terraformCloud/errors';
import { handleZodiosError } from '../helpers';
import { TerraformCloudSession } from './terraformCloudSession';
import { InvalidToken } from './invalidToken';

export class TerraformCloudSessionHandler {
  constructor(
    private outputChannel: vscode.OutputChannel,
    private reporter: TelemetryReporter,
    private readonly secretStorage: vscode.SecretStorage,
    private readonly sessionKey: string,
  ) {}

  async get(): Promise<TerraformCloudSession | undefined> {
    const rawSession = await this.secretStorage.get(this.sessionKey);
    if (!rawSession) {
      return undefined;
    }
    const session: TerraformCloudSession = JSON.parse(rawSession);
    return session;
  }

  async store(token: string): Promise<TerraformCloudSession> {
    try {
      const user = await earlyApiClient.getAccount({
        headers: {
          authorization: `Bearer ${token}`,
        },
      });

      const session = new TerraformCloudSession(token, {
        label: user.data.attributes.username,
        id: user.data.id,
      });

      await this.secretStorage.store(this.sessionKey, JSON.stringify(session));
      return session;
    } catch (error) {
      if (error instanceof ZodiosError) {
        handleZodiosError(error, 'Failed to process user details', this.outputChannel, this.reporter);
        throw error;
      }

      if (isErrorFromAlias(earlyApiClient.api, 'getAccount', error)) {
        if ((error.response.status as number) === 401) {
          throw new InvalidToken();
        }
        this.reporter.sendTelemetryException(error);
        throw new Error(`Failed to login: ${apiErrorsToString(error.response.data.errors)}`);
      } else if (error instanceof Error) {
        this.reporter.sendTelemetryException(error);
      }

      throw error;
    }
  }

  async delete(): Promise<void> {
    return this.secretStorage.delete(this.sessionKey);
  }
}
