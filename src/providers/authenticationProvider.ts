/**
 * Copyright (c) HashiCorp, Inc.
 * SPDX-License-Identifier: MPL-2.0
 */

import * as os from 'os';
import * as path from 'path';
import * as vscode from 'vscode';
import axios from 'axios';
import { earlyApiClient, TerraformCloudHost } from '../terraformCloud';

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
  constructor(private readonly secretStorage: vscode.SecretStorage, private readonly sessionKey: string) {}

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
export class TerraformCloudAuthenticationProvider implements vscode.AuthenticationProvider, vscode.Disposable {
  static providerLabel = 'HashiCorp Terraform Cloud';
  static providerID = 'HashiCorpTerraformCloud';
  private sessionKey = 'HashiCorpTerraformCloudSession';
  private logger: vscode.LogOutputChannel;
  private sessionHandler: TerraformCloudSessionHandler;
  // this property is used to determine if the session has been changed in another window of VS Code
  // it's a promise, so we can set in the constructor where we can't execute async code
  private sessionPromise: Promise<vscode.AuthenticationSession | undefined>;
  private disposable: vscode.Disposable | undefined;

  private _onDidChangeSessions =
    new vscode.EventEmitter<vscode.AuthenticationProviderAuthenticationSessionsChangeEvent>();

  constructor(private readonly secretStorage: vscode.SecretStorage, private readonly ctx: vscode.ExtensionContext) {
    this.logger = vscode.window.createOutputChannel('HashiCorp Authentication', { log: true });
    this.sessionHandler = new TerraformCloudSessionHandler(this.secretStorage, this.sessionKey);
    ctx.subscriptions.push(
      vscode.commands.registerCommand('terraform.cloud.login', async () => {
        const session = await vscode.authentication.getSession(TerraformCloudAuthenticationProvider.providerID, [], {
          createIfNone: true,
        });
        vscode.window.showInformationMessage(`Hello ${session.account.label}`);
      }),
    );

    this.sessionPromise = this.sessionHandler.get();
    this.disposable = vscode.Disposable.from(
      this.secretStorage.onDidChange((e) => {
        if (e.key === this.sessionKey) {
          this.checkForUpdates();
        }
      }),
    );
  }

  get onDidChangeSessions(): vscode.Event<vscode.AuthenticationProviderAuthenticationSessionsChangeEvent> {
    // Expose our internal event emitter to the outer world
    return this._onDidChangeSessions.event;
  }

  // This function is called first when `vscode.authentication.getSessions` is called.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async getSessions(scopes?: string[] | undefined): Promise<readonly vscode.AuthenticationSession[]> {
    try {
      const session = await this.sessionPromise;
      this.logger.info('Successfully fetched Terraform Cloud session.');
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

  // This function is called after `this.getSessions` is called and only when:
  // - `this.getSessions` returns nothing but `createIfNone` was set to `true` in `vscode.authentication.getSessions`
  // - `vscode.authentication.getSessions` was called with `forceNewSession: true`
  // - The end user initiates the "silent" auth flow via the Accounts menu
  async createSession(_scopes: readonly string[]): Promise<vscode.AuthenticationSession> {
    // Prompt for the UAT.
    const token = await this.promptForToken();
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
    const session = await this.sessionPromise;
    if (!session) {
      return;
    }

    this.logger.info('Removing current session');
    await this.sessionHandler.delete();

    // Notify VSCode's UI
    this._onDidChangeSessions.fire({ added: [], removed: [session], changed: [] });
  }

  // This is a crucial function that handles whether or not the session has changed in
  // a different window of VS Code and sends the necessary event if it has.
  private async checkForUpdates(): Promise<void> {
    const previousSession = await this.sessionPromise;
    this.sessionPromise = this.sessionHandler.get();
    const session = await this.sessionPromise;

    const added: vscode.AuthenticationSession[] = [];
    const removed: vscode.AuthenticationSession[] = [];
    const changed: vscode.AuthenticationSession[] = [];

    if (session?.accessToken && !previousSession?.accessToken) {
      this.logger.info('Session added');
      added.push(session);
    } else if (!session?.accessToken && previousSession?.accessToken) {
      this.logger.info('Session removed');
      removed.push(previousSession);
    } else if (session && previousSession && session.accessToken !== previousSession.accessToken) {
      this.logger.info('Session changed');
      changed.push(session);
    } else {
      return;
    }

    this._onDidChangeSessions.fire({ added: added, removed: removed, changed: changed });
  }

  private async promptForToken(): Promise<string | undefined> {
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
      return undefined;
    }

    // TODO: Change to production URL
    const terraformCloudURL = `https://${TerraformCloudHost}/app/settings/tokens?source=vscode-terraform`;
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

    return token;
  }

  private async getTerraformCLIToken() {
    // detect if stored auth token is present
    // ~/.terraform.d/credentials.tfrc.json
    const credFilePath = path.join(os.homedir(), '.terraform.d', 'credentials.tfrc.json');
    if ((await this.pathExists(credFilePath)) === false) {
      vscode.window.showErrorMessage(
        'Terraform credential file not found. Please login using the Terraform CLI and try again.',
      );
      return undefined;
    }

    // read and marshall json file
    let text: string;
    try {
      const content = await vscode.workspace.fs.readFile(vscode.Uri.file(credFilePath));
      text = Buffer.from(content).toString('utf8');
    } catch (error) {
      vscode.window.showErrorMessage(
        'Failed to read configuration file. Please login using the Terraform CLI and try again',
      );
      return undefined;
    }

    // find app.terraform.io token
    try {
      const data = JSON.parse(text);
      const cred = data.credentials[TerraformCloudHost];
      return cred.token;
    } catch (error) {
      vscode.window.showErrorMessage(
        `No token found for ${TerraformCloudHost}. Please login using the Terraform CLI and try again`,
      );
      return undefined;
    }
  }

  private async pathExists(filePath: string): Promise<boolean> {
    try {
      await vscode.workspace.fs.stat(vscode.Uri.file(filePath));
      return true;
    } catch (error) {
      return false;
    }
  }

  dispose() {
    this.disposable?.dispose();
  }
}
