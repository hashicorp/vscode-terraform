/**
 * Copyright (c) HashiCorp, Inc.
 * SPDX-License-Identifier: MPL-2.0
 */

import axios from 'axios';
import * as vscode from 'vscode';

import { apiClient } from '../../api/terraformCloud';
import stripAnsi from './helpers';

export class PlanLogContentProvider implements vscode.TextDocumentContentProvider {
  onDidChangeEmitter = new vscode.EventEmitter<vscode.Uri>();
  onDidChange = this.onDidChangeEmitter.event;

  async provideTextDocumentContent(uri: vscode.Uri): Promise<string> {
    try {
      const logUrl = await this.getLogUrl(uri);
      if (!logUrl) {
        throw new Error('Unable to parse log URL');
      }

      const result = await axios.get<string>(logUrl, { headers: { Accept: 'text/plain' } });
      return this.parseLog(result.data);
    } catch (error) {
      if (error instanceof Error) {
        await vscode.window.showErrorMessage('Failed to load log:', error.message);
      } else if (typeof error === 'string') {
        await vscode.window.showErrorMessage('Failed to load log:', error);
      }

      console.error(error);
      return '';
    }
  }

  private parseLog(text: string) {
    text = stripAnsi(text); // strip ansi escape codes
    text = text.replace('', '').replace('', ''); // remove control characters

    return text;
  }

  private async getLogUrl(uri: vscode.Uri) {
    const id = uri.path.replace('/', '');

    switch (uri.authority) {
      case 'plan':
        return await this.getPlanLogUrl(id);
      case 'apply':
        return await this.getApplyLogUrl(id);
    }
  }

  private async getPlanLogUrl(id: string) {
    const plan = await apiClient.getPlan({
      params: {
        plan_id: id,
      },
    });

    return plan.data.attributes['log-read-url'];
  }

  private async getApplyLogUrl(id: string) {
    const apply = await apiClient.getApply({
      params: {
        apply_id: id,
      },
    });

    return apply.data.attributes['log-read-url'];
  }
}
