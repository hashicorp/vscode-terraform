/**
 * Copyright (c) HashiCorp, Inc.
 * SPDX-License-Identifier: MPL-2.0
 */

import * as os from 'os';
import * as path from 'path';
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

    const choice = await vscode.window.showQuickPick(
      [
        {
          label: 'Stored User Token',
          detail: 'Use a token stored in the Terraform CLI configuration file',
        },
        {
          label: 'Existing User Token',
          detail: 'Enter a token manually',
        },
        {
          label: 'Open to generate a User token',
          detail: 'Open the Terraform Cloud website to generate a new token',
        },
      ],
      {
        canPickMany: false,
        ignoreFocusOut: true,
        placeHolder: 'Choose a method to enter a Terraform Cloud User Token',
        title: 'HashiCorp Terraform Cloud Authentication',
      },
    );
    if (choice === undefined) {
      throw new Error('Must login to continue');
    }

    // TODO: Change to production URL
    const terraformCloudURL = 'https://app.staging.terraform.io/app/settings/tokens?source=terraform-login';

    let token: string | undefined;
    switch (choice.label) {
      case 'Open to generate a User token':
        await vscode.env.openExternal(vscode.Uri.parse(terraformCloudURL));
        // Prompt for the UAT.
        token = await vscode.window.showInputBox({
          ignoreFocusOut: true,
          placeHolder: 'User access token',
          prompt: 'Enter an HashiCorp Terraform User Access Token (UAT).',
          password: true,
        });
        break;
      case 'Existing User Token':
        // Prompt for the UAT.
        token = await vscode.window.showInputBox({
          ignoreFocusOut: true,
          placeHolder: 'User access token',
          prompt: 'Enter an HashiCorp Terraform User Access Token (UAT).',
          password: true,
        });
        break;
      case 'Stored User Token':
        token = await this.getTerraformCLIToken();
        break;
      default:
        break;
    }

    // Note: this doesn't do any validation of the token beyond making sure it's not empty.
    if (token === undefined || token === '') {
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

  private async getTerraformCLIToken() {
    // detect if stored auth token is present
    // ~/.terraform.d/credentials.tfrc.json
    const credFilePath = path.join(os.homedir(), '.terraform.d', 'credentials.tfrc.json');
    if ((await this.pathExists(credFilePath)) === false) {
      // TODO show error message
      vscode.window.showErrorMessage(
        'Terraform credential file not found. Please login using the Terraform CLI and try again.',
      );
      return undefined;
    }

    const content = await vscode.workspace.fs.readFile(vscode.Uri.file(credFilePath));
    // read and marshall json file
    const data = JSON.parse(Buffer.from(content).toString('utf8'));

    // find app.terraform.io token
    try {
      const cred = data.credentials['app.staging.terraform.io'];
      return cred.token;
    } catch (error) {
      vscode.window.showErrorMessage(
        'No token found for app.staging.terraform.io. Please login using the Terraform CLI and try again',
      );
      return undefined;
    }
  }

  async pathExists(filePath: string): Promise<boolean> {
    try {
      await vscode.workspace.fs.stat(vscode.Uri.file(filePath));
      return true;
    } catch (error) {
      return false;
    }
  }

  dispose() {
    this.initializedDisposable?.dispose();
  }
}
