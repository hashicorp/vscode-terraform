import { BaseLanguageClient, ClientCapabilities, ServerCapabilities, StaticFeature } from 'vscode-languageclient';

export class CustomSemanticTokens implements StaticFeature {
  constructor(
    private _client: BaseLanguageClient,
    private extTokenTypes: string[],
    private extTokenModifiers: string[],
  ) {}

  public fillClientCapabilities(capabilities: ClientCapabilities): void {
    if (!capabilities.textDocument || !capabilities.textDocument.semanticTokens) {
      return;
    }

    const tokenTypes = capabilities.textDocument.semanticTokens.tokenTypes;
    capabilities.textDocument.semanticTokens.tokenTypes = tokenTypes.concat(this.extTokenTypes);

    const tokenModifiers = capabilities.textDocument.semanticTokens.tokenModifiers;
    capabilities.textDocument.semanticTokens.tokenModifiers = tokenModifiers.concat(this.extTokenModifiers);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public initialize(capabilities: ServerCapabilities): void {
    return;
  }

  public dispose(): void {
    return;
  }
}
