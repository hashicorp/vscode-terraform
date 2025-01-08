// Copyright (c) The OpenTofu Authors
// SPDX-License-Identifier: MPL-2.0
// Copyright (c) HashiCorp, Inc.
// SPDX-License-Identifier: MPL-2.0

import * as vscode from 'vscode';
import {
  BaseLanguageClient,
  ClientCapabilities,
  FeatureState,
  ReferenceContext,
  ReferencesRequest,
  ServerCapabilities,
  StaticFeature,
} from 'vscode-languageclient';
import { config } from '../utils/vscode';

import { ExperimentalClientCapabilities } from './types';

type Position = {
  line: number;
  character: number;
};

type RefContext = {
  includeDeclaration: boolean;
};

const CLIENT_CMD_ID = 'client.showReferences';
const VSCODE_SHOW_REFERENCES = 'editor.action.showReferences';

export class ShowReferencesFeature implements StaticFeature {
  private registeredCommands: vscode.Disposable[] = [];
  private isEnabled = config('opentofu').get<boolean>('codelens.referenceCount', false);

  constructor(private _client: BaseLanguageClient) {}

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  clear(): void {}

  getState(): FeatureState {
    return {
      kind: 'static',
    };
  }

  public fillClientCapabilities(capabilities: ClientCapabilities & ExperimentalClientCapabilities): void {
    if (this.isEnabled === false) {
      return;
    }
    if (!capabilities['experimental']) {
      capabilities['experimental'] = {};
    }
    capabilities['experimental']['showReferencesCommandId'] = CLIENT_CMD_ID;
  }

  public initialize(capabilities: ServerCapabilities): void {
    if (!capabilities.experimental?.referenceCountCodeLens) {
      return;
    }

    if (this.isEnabled === false) {
      return;
    }

    const showRefs = vscode.commands.registerCommand(CLIENT_CMD_ID, async (pos: Position, refCtx: RefContext) => {
      const client = this._client;
      const doc = vscode.window?.activeTextEditor?.document;
      if (!doc) {
        return;
      }

      const position = new vscode.Position(pos.line, pos.character);
      const context: ReferenceContext = { includeDeclaration: refCtx.includeDeclaration };

      const provider = client.getFeature(ReferencesRequest.method).getProvider(doc);
      if (!provider) {
        return;
      }

      const tokenSource = new vscode.CancellationTokenSource();
      const locations = await provider.provideReferences(doc, position, context, tokenSource.token);

      await vscode.commands.executeCommand(VSCODE_SHOW_REFERENCES, doc.uri, position, locations);
    });

    this.registeredCommands.push(showRefs);
  }

  public dispose(): void {
    this.registeredCommands.forEach(function (cmd, index, commands) {
      cmd.dispose();
      commands.splice(index, 1);
    });
  }
}
