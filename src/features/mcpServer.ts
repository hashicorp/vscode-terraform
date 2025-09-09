/**
 * Copyright (c) HashiCorp, Inc.
 * SPDX-License-Identifier: MPL-2.0
 */

import TelemetryReporter from '@vscode/extension-telemetry';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as vscode from 'vscode';
import { config } from '../utils/vscode';

const execAsync = promisify(exec);

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
    private outputChannel: vscode.OutputChannel,
  ) {
    this.activate();
  }

  /**
   * Helper method to format and log error information
   */
  private logError(message: string, error: unknown): void {
    this.outputChannel.appendLine(`${message}: ${String(error)}`);
    if (error instanceof Error && error.stack) {
      this.outputChannel.appendLine(`Stack trace: ${error.stack}`);
    }
  }

  public activate(): void {
    try {
      if (!this.isMcpApiAvailable()) {
        return;
      }

      const provider = this.registerMcpServerProvider();
      if (provider) {
        this.context.subscriptions.push(provider);
      }
    } catch (error) {
      this.logError('Failed to register MCP server definition provider', error);
      // Don't throw - let the extension continue to work without MCP server
    }
  }

  private isMcpApiAvailable(): boolean {
    // Check if VS Code has the MCP API available
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const available = typeof (vscode as any).lm?.registerMcpServerDefinitionProvider === 'function';
    if (!available) {
      this.outputChannel.appendLine(`Terraform MCP API is not available in current VS Code version ${vscode.version}`);
    }
    return available;
  }

  private isMcpServerEnabled(): boolean {
    const isEnabled = config('terraform').get<boolean>('mcp.server.enabled') === true;
    if (!isEnabled) {
      this.outputChannel.appendLine('HashiCorp Terraform MCP Server integration is disabled by configuration');
    }
    return isEnabled;
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
        resolveMcpServerDefinition: (definition: McpServerDefinition) => {
          return this.resolveMcpServerDefinition(definition);
        },
      });
    } catch (error) {
      this.logError('Error registering MCP server provider', error);
      return undefined;
    }
  }

  // According to VS Code API docs, no user interaction should happen here
  // Just provide the available MCP server definitions
  private provideMcpServerDefinitions(): McpServerDefinition[] {
    try {
      if (!this.isMcpServerEnabled()) {
        return [];
      }

      const server: McpServerDefinition = {
        label: 'HashiCorp Terraform MCP Server',
        command: 'docker',
        args: ['run', '-i', '--rm', 'hashicorp/terraform-mcp-server'],
        env: {},
      };

      return [server];
    } catch (error) {
      this.logError('Error providing MCP server definitions', error);
      return [];
    }
  }

  // All user interactions should happen here
  // Should return resolved server definition if server should be started
  private async resolveMcpServerDefinition(definition: McpServerDefinition): Promise<McpServerDefinition> {
    const dockerAvailable = await this.dockerValidations();
    if (!dockerAvailable) {
      throw new Error('Docker is required but not available or running');
    }

    return definition;
  }

  private async dockerValidations(): Promise<boolean> {
    try {
      if (!(await this.checkDockerRunning())) {
        return false;
      }

      return true;
    } catch (error) {
      this.logError('Docker validation error', error);
      return false;
    }
  }

  // Check if container runtime is available and running
  // The 'docker info' command validates both installation and daemon status
  private async checkDockerRunning(): Promise<boolean> {
    try {
      await execAsync('docker info', { timeout: 5000 });
      return true;
    } catch (error) {
      this.logError('Docker daemon check failed', error);
      void vscode.window
        .showWarningMessage('Please install and start a Docker compatible runtime to use this feature.', 'Learn More')
        .then((selection) => {
          if (selection === 'Learn More') {
            void vscode.env.openExternal(vscode.Uri.parse('https://docs.docker.com/get-started/'));
          }
        });
      return false;
    }
  }

  dispose(): void {
    // context.subscriptions will be disposed by the extension, so any explicit code should not be required.
  }
}
