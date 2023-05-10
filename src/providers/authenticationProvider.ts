/**
 * Copyright (c) HashiCorp, Inc.
 * SPDX-License-Identifier: MPL-2.0
 */

import * as vscode from 'vscode';
import axios from 'axios';
import { apiClient, earlyApiClient } from '../terraformCloud';

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

export class TerraformCloudAuthenticationProvider implements vscode.AuthenticationProvider, vscode.Disposable {
  static providerLabel = 'HashiCorp Terraform Cloud';
  static providerID = 'HashiCorpTerraformCloud';
  private static secretKey = 'HashiCorpTerraformCloud';
  private logger: vscode.LogOutputChannel;

  // this property is used to determine if the token has been changed in another window of VS Code.
  private currentToken: string | undefined;
  private initializedDisposable: vscode.Disposable | undefined;

  private _onDidChangeSessions =
    new vscode.EventEmitter<vscode.AuthenticationProviderAuthenticationSessionsChangeEvent>();

  constructor(private readonly secretStorage: vscode.SecretStorage, private readonly ctx: vscode.ExtensionContext) {
    this.logger = vscode.window.createOutputChannel('HashiCorp Authentication', { log: true });
    this.ctx.subscriptions.push(
      vscode.commands.registerCommand('terraform.cloud.login', async () => {
        const session = await vscode.authentication.getSession(TerraformCloudAuthenticationProvider.providerID, [], {
          createIfNone: true,
        });

        vscode.window.showInformationMessage(`Hello ${session.account.label}!`);

        await vscode.commands.executeCommand('terraform.cloud.organization.picker');
      }),
    );
  }

  get onDidChangeSessions(): vscode.Event<vscode.AuthenticationProviderAuthenticationSessionsChangeEvent> {
    return this._onDidChangeSessions.event;
  }

  // This function is called first when `vscode.authentication.getSessions` is called.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async getSessions(scopes?: string[] | undefined): Promise<readonly vscode.AuthenticationSession[]> {
    this.ensureInitialized();

    this.logger.info('Reading sessions from storage...');
    const token = await this.cacheTokenFromStorage();

    if (token === undefined) {
      this.logger.info('No stored sessions!');
      return [];
    }

    this.logger.info('Got stored sessions!');

    try {
      // TODO: replace with secretStorage.get when all session data is in secretStorage
      const user = await earlyApiClient.getUser({
        headers: {
          authorization: `Bearer ${token}`,
        },
      });
      this.logger.info('Got user info');

      return token
        ? [
            new TerraformCloudSession(token, {
              label: user.data.attributes.username,
              id: user.data.attributes.email,
            }),
          ]
        : [];
    } catch (error) {
      if (error instanceof Error) {
        vscode.window.showErrorMessage(error.message);
      } else if (typeof error === 'string') {
        vscode.window.showErrorMessage(error);
      }

      // TODO: Handle 401 auth errors here
      return [];
    }
  }

  // This function is called after `this.getSessions` is called and only when:
  // - `this.getSessions` returns nothing but `createIfNone` was set to `true` in `vscode.authentication.getSessions`
  // - `vscode.authentication.getSessions` was called with `forceNewSession: true`
  // - The end user initiates the "silent" auth flow via the Accounts menu
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async createSession(_scopes: readonly string[]): Promise<vscode.AuthenticationSession> {
    this.ensureInitialized();

    // Prompt for the UAT.
    const token = await vscode.window.showInputBox({
      ignoreFocusOut: true,
      placeHolder: 'User access token',
      prompt: 'Enter an HashiCorp Terraform User Access Token (UAT).',
      password: true,
    });

    // Note: this example doesn't do any validation of the token beyond making sure it's not empty.
    if (!token) {
      this.logger.error('User did not provide a UAT');
      throw new Error('UAT is required');
    }

    try {
      const user = await earlyApiClient.getUser({
        headers: {
          authorization: `Bearer ${token}`,
        },
      });

      // Don't set `currentToken` here, since we want to fire the proper events in the `checkForUpdates` call
      await this.secretStorage.store(TerraformCloudAuthenticationProvider.secretKey, token);
      this.logger.info('Successfully logged in to HashiCorp Terraform');

      const session = new TerraformCloudSession(token, {
        label: user.data.attributes.username,
        id: user.data.attributes.email,
      });

      this._onDidChangeSessions.fire({ added: [session], removed: [], changed: [] });
      // label is what is display in the UI
      return session;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        vscode.window.showErrorMessage('Invalid token supplied, please try again');
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
    this.logger.info('Detecting current logged in session');
    const session = (await this.getSessions())[0];

    this.logger.info('Removing current session');
    await this.secretStorage.delete(TerraformCloudAuthenticationProvider.secretKey);

    this._onDidChangeSessions.fire({ added: [], removed: [session], changed: [] });
  }

  private async ensureInitialized(): Promise<void> {
    if (this.initializedDisposable !== undefined) {
      return;
    }

    await this.cacheTokenFromStorage();

    this.initializedDisposable = vscode.Disposable.from(
      // This onDidChange event happens when the secret storage changes in _any window_ since
      // secrets are shared across all open windows.
      this.secretStorage.onDidChange((e) => {
        if (e.key === TerraformCloudAuthenticationProvider.secretKey) {
          this.logger.info('Authentication secret storage change');
          void this.checkForUpdates();
        }
      }),
      // This fires when the user initiates a "silent" auth flow via the Accounts menu.
      vscode.authentication.onDidChangeSessions((e) => {
        if (e.provider.id === TerraformCloudAuthenticationProvider.providerID) {
          this.logger.info('Authentication provider change');
          void this.checkForUpdates();
        }
      }),
    );
  }

  // This is a crucial function that handles whether or not the token has changed in
  // a different window of VS Code and sends the necessary event if it has.
  private async checkForUpdates(): Promise<void> {
    const added: vscode.AuthenticationSession[] = [];
    const removed: vscode.AuthenticationSession[] = [];
    const changed: vscode.AuthenticationSession[] = [];

    const previousToken = this.currentToken;
    const session = (await this.getSessions())[0];

    if (session?.accessToken && !previousToken) {
      this.logger.info('Session added');
      added.push(session);
    } else if (!session?.accessToken && previousToken) {
      this.logger.info('Session removed');
      removed.push(session);
    } else if (session?.accessToken !== previousToken) {
      this.logger.info('Session changed');
      changed.push(session);
    } else {
      return;
    }

    await this.cacheTokenFromStorage();
    this._onDidChangeSessions.fire({ added: added, removed: removed, changed: changed });
  }

  private async cacheTokenFromStorage() {
    this.currentToken = await this.secretStorage.get(TerraformCloudAuthenticationProvider.secretKey);
    return this.currentToken;
  }

  dispose() {
    this.initializedDisposable?.dispose();
  }
}
