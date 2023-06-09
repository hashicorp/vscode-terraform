/**
 * Copyright (c) HashiCorp, Inc.
 * SPDX-License-Identifier: MPL-2.0
 */

import * as vscode from 'vscode';

export function GetRunStatusIcon(status: string): vscode.ThemeIcon {
  switch (status) {
    // in progress
    case 'pending':
    case 'fetching':
    case 'pre_plan_running':
    case 'queuing':
    case 'planning':
    case 'cost_estimating':
    case 'policy_checking':
    case 'apply_queued':
    case 'applying':
    case 'post_plan_running':
    case 'plan_queued':
      return new vscode.ThemeIcon('sync~spin');

    case 'fetching_completed':
    case 'pre_plan_completed':
    case 'planned':
    case 'cost_estimated':
    case 'policy_override':
    case 'policy_checked':
    case 'confirmed':
    case 'post_plan_completed':
    case 'planned_and_finished':
      return new vscode.ThemeIcon('pass');
    case 'policy_soft_failed':
      return new vscode.ThemeIcon('warning');
    case 'applied':
      return new vscode.ThemeIcon('pass-filled');
    case 'discarded':
    case 'canceled':
    case 'force_canceled':
      return new vscode.ThemeIcon('discard');
    case 'errored':
      return new vscode.ThemeIcon('error');
  }

  return new vscode.ThemeIcon('indent');
}
