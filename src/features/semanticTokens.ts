// Copyright (c) The OpenTofu Authors
// SPDX-License-Identifier: MPL-2.0
// Copyright (c) HashiCorp, Inc.
// SPDX-License-Identifier: MPL-2.0

import {
  BaseLanguageClient,
  ClientCapabilities,
  FeatureState,
  ServerCapabilities,
  StaticFeature,
} from 'vscode-languageclient';

export interface PartialManifest {
  contributes: {
    semanticTokenTypes?: ObjectWithId[];
    semanticTokenModifiers?: ObjectWithId[];
  };
}

interface ObjectWithId {
  id: string;
}

export class CustomSemanticTokens implements StaticFeature {
  constructor(
    private _client: BaseLanguageClient,
    private manifest: PartialManifest,
  ) {}

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  clear(): void {}

  getState(): FeatureState {
    return {
      kind: 'static',
    };
  }

  public fillClientCapabilities(capabilities: ClientCapabilities): void {
    if (!capabilities.textDocument || !capabilities.textDocument.semanticTokens) {
      return;
    }

    const extSemanticTokenTypes = this.tokenTypesFromExtManifest(this.manifest);
    const extSemanticTokenModifiers = this.tokenModifiersFromExtManifest(this.manifest);

    const tokenTypes = capabilities.textDocument.semanticTokens.tokenTypes;
    capabilities.textDocument.semanticTokens.tokenTypes = tokenTypes.concat(extSemanticTokenTypes);

    const tokenModifiers = capabilities.textDocument.semanticTokens.tokenModifiers;
    capabilities.textDocument.semanticTokens.tokenModifiers = tokenModifiers.concat(extSemanticTokenModifiers);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public initialize(capabilities: ServerCapabilities): void {
    return;
  }

  public dispose(): void {
    return;
  }

  tokenTypesFromExtManifest(manifest: PartialManifest): string[] {
    if (!manifest.contributes.semanticTokenTypes) {
      return [];
    }
    return manifest.contributes.semanticTokenTypes.map((token: ObjectWithId) => token.id);
  }

  tokenModifiersFromExtManifest(manifest: PartialManifest): string[] {
    if (!manifest.contributes.semanticTokenModifiers) {
      return [];
    }

    return manifest.contributes.semanticTokenModifiers.map((modifier: ObjectWithId) => modifier.id);
  }
}
