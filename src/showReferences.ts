import * as vscode from 'vscode';
import {
  BaseLanguageClient,
  ClientCapabilities,
  ReferenceContext,
  ReferencesRequest,
  ServerCapabilities,
  StaticFeature,
} from 'vscode-languageclient';

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

  constructor(private _client: BaseLanguageClient) {}

  public fillClientCapabilities(capabilities: ClientCapabilities): void {
    if (!capabilities['experimental']) {
      capabilities['experimental'] = {};
    }
    capabilities['experimental']['showReferencesCommandId'] = CLIENT_CMD_ID;
  }

  public initialize(capabilities: ServerCapabilities): void {
    if (!capabilities.experimental?.referenceCountCodeLens) {
      return;
    }

    const showRefs = vscode.commands.registerCommand(CLIENT_CMD_ID, async (pos: Position, refCtx: RefContext) => {
      const client = this._client;

      const doc = vscode.window.activeTextEditor.document;

      const position = new vscode.Position(pos.line, pos.character);
      const context: ReferenceContext = { includeDeclaration: refCtx.includeDeclaration };

      const provider: vscode.ReferenceProvider = client.getFeature(ReferencesRequest.method).getProvider(doc);
      const tokenSource: vscode.CancellationTokenSource = new vscode.CancellationTokenSource();

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
