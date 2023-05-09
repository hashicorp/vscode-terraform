/**
 * Copyright (c) HashiCorp, Inc.
 * SPDX-License-Identifier: MPL-2.0
 */

import * as vscode from 'vscode';
import axios from 'axios';
import { earlyApiClient } from '../terraformCloud';

class TerraformCloudSession implements vscode.AuthenticationSession {
  // This id isn't used for anything yet, so we set it to a constant
  readonly id = TerraformCloudAuthenticationProvider.providerID;

  // In the future, we may use the UAT permissions as scopes
  // but right now have no use fior them, so we have an empty array here.
  readonly scopes = [];

  /**
   *
   * @param accessToken The personal access token to use for authentication
   * @param account The user account for the specified token
   */
  constructor(public readonly accessToken: string, public account: vscode.AuthenticationSessionAccountInformation) {}
}

class InvalidToken extends Error {
  constructor() {
    super('Invalid token');
  }
}

class TerraformCloudSessionHandler {
  private sessionKey = 'HashiCorpTerraformCloudSession';

  constructor(private readonly secretStorage: vscode.SecretStorage) {}

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
      const user = await earlyApiClient.getUser({
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
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        throw new InvalidToken();
      }
      throw error;
    }
  }

  async delete(): Promise<void> {
    return this.secretStorage.delete(this.sessionKey);
  }
}

export class TerraformCloudAuthenticationProvider implements vscode.AuthenticationProvider {
  static providerLabel = 'HashiCorp Terraform Cloud';
  static providerID = 'HashiCorpTerraformCloud';
  private logger: vscode.LogOutputChannel;
  private sessionHandler: TerraformCloudSessionHandler;

  private _onDidChangeSessions =
    new vscode.EventEmitter<vscode.AuthenticationProviderAuthenticationSessionsChangeEvent>();

  constructor(private readonly secretStorage: vscode.SecretStorage, private readonly ctx: vscode.ExtensionContext) {
    this.logger = vscode.window.createOutputChannel('HashiCorp Authentication', { log: true });
    this.sessionHandler = new TerraformCloudSessionHandler(this.secretStorage);
    ctx.subscriptions.push(
      vscode.commands.registerCommand('terraform.cloud.login', async () => {
        const session = await vscode.authentication.getSession(TerraformCloudAuthenticationProvider.providerID, [], {
          createIfNone: true,
        });
        vscode.window.showInformationMessage(`Hello ${session.account.label}`);
      }),
    );
  }

  get onDidChangeSessions(): vscode.Event<vscode.AuthenticationProviderAuthenticationSessionsChangeEvent> {
    // TODO: What does this do?
    return this._onDidChangeSessions.event;
  }

  // This function is called first when `vscode.authentication.getSessions` is called.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async getSessions(scopes?: string[] | undefined): Promise<readonly vscode.AuthenticationSession[]> {
    try {
      const session = await this.sessionHandler.get();
      return session ? [session] : [];
    } catch (error) {
      if (error instanceof Error) {
        vscode.window.showErrorMessage(error.message);
      } else if (typeof error === 'string') {
        vscode.window.showErrorMessage(error);
      }
      return [];
    }
  }

  async createSession(_scopes: readonly string[]): Promise<vscode.AuthenticationSession> {
    // Prompt for the UAT.
    const token = await vscode.window.showInputBox({
      ignoreFocusOut: true,
      placeHolder: 'User access token',
      prompt: 'Enter an HashiCorp Terraform User Access Token (UAT).',
      password: true,
    });
    if (!token) {
      this.logger.error('User did not provide a UAT');
      throw new Error('UAT is required');
    }

    try {
      const session = await this.sessionHandler.store(token);
      this.logger.info('Successfully logged in to Terraform Cloud');

      // Notify VSCode's UI
      this._onDidChangeSessions.fire({ added: [session], removed: [], changed: [] });

      return session;
    } catch (error) {
      if (error instanceof InvalidToken) {
        vscode.window.showErrorMessage(`${error.message}. Please try again`);
        return this.createSession(_scopes);
      } else if (error instanceof Error) {
        vscode.window.showErrorMessage(error.message);
        this.logger.error(error.message);
      } else if (typeof error === 'string') {
        vscode.window.showErrorMessage(error);
        this.logger.error(error);
      }

      throw error;
    }
  }

  // This function is called when the end user signs out of the account.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async removeSession(_sessionId: string): Promise<void> {
    const session = await this.sessionHandler.get();
    if (!session) {
      return;
    }

    this.logger.info('Removing current session');
    await this.sessionHandler.delete();

    // Notify VSCode's UI
    this._onDidChangeSessions.fire({ added: [], removed: [session], changed: [] });
  }
}
