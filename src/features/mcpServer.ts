/**
 * Copyright (c) HashiCorp, Inc.
 * SPDX-License-Identifier: MPL-2.0
 */

import TelemetryReporter from '@vscode/extension-telemetry';
import * as vscode from 'vscode';

interface McpServerDefinition {
  label: string;
  command: string;
  args: string[];
  env: Record<string, string>;
}

export class McpServerFeature {
  constructor(
    private context: vscode.ExtensionContext,
    private reporter: TelemetryReporter,
  ) {
    this.activate();
  }

  public activate(): void {
    try {
      // Check if the MCP API is available in this version of VS Code
      if (!this.isMcpApiAvailable()) {
        return;
      }

      // Register the MCP server definition provider using dynamic API access
      const provider = this.registerMcpServerProvider();
      if (provider) {
        this.context.subscriptions.push(provider);
      }
    } catch (error) {
      console.error('Failed to register MCP server definition provider:', error);
      // Don't throw - let the extension continue to work without MCP server
    }
  }

  private isMcpApiAvailable(): boolean {
    // Check if VS Code has the MCP API available
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return typeof (vscode as any).lm?.registerMcpServerDefinitionProvider === 'function';
  }

  private registerMcpServerProvider(): vscode.Disposable | undefined {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const vscodeAny = vscode as any;
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      return vscodeAny.lm.registerMcpServerDefinitionProvider('terraform.mcp.server', {
        provideMcpServerDefinitions: () => {
          return this.provideMcpServerDefinitions();
        },
      });
    } catch (error) {
      console.error('Error registering MCP server provider:', error);
      return undefined;
    }
  }

  private provideMcpServerDefinitions(): McpServerDefinition[] {
    try {
      const server: McpServerDefinition = {
        label: 'HashiCorp Terraform MCP Server',
        command: 'docker',
        args: ['run', '-i', '--rm', 'hashicorp/terraform-mcp-server'],
        env: {},
      };

      return [server];
    } catch (error) {
      console.error('Error providing MCP server definitions:', error);
      return [];
    }
  }

  public dispose(): void {
    // TODO
  }
}
