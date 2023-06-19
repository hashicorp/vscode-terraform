/**
 * Copyright (c) HashiCorp, Inc.
 * SPDX-License-Identifier: MPL-2.0
 */

import * as vscode from 'vscode';

export function GetRunStatusIcon(status?: string): vscode.ThemeIcon {
  switch (status) {
    // in progress
    case 'pending':
      return new vscode.ThemeIcon('debug-pause', new vscode.ThemeColor('charts.gray'));
    case 'fetching':
      return new vscode.ThemeIcon('sync~spin', new vscode.ThemeColor('charts.gray'));
    case 'pre_plan_running':
      return new vscode.ThemeIcon('run-status-running', new vscode.ThemeColor('charts.gray'));
    case 'queuing':
      return new vscode.ThemeIcon('debug-pause', new vscode.ThemeColor('charts.gray'));
    case 'planning':
      return new vscode.ThemeIcon('run-status-running', new vscode.ThemeColor('charts.gray'));
    case 'cost_estimating':
      return new vscode.ThemeIcon('sync~spin', new vscode.ThemeColor('charts.gray'));
    case 'policy_checking':
      return new vscode.ThemeIcon('sync~spin', new vscode.ThemeColor('charts.gray'));
    case 'apply_queued':
      return new vscode.ThemeIcon('debug-pause', new vscode.ThemeColor('charts.gray'));
    case 'applying':
      return new vscode.ThemeIcon('sync~spin', new vscode.ThemeColor('charts.gray'));
    case 'post_plan_running':
      return new vscode.ThemeIcon('run-status-running', new vscode.ThemeColor('charts.gray'));
    case 'plan_queued':
      return new vscode.ThemeIcon('debug-pause');
    case 'fetching_completed':
      return new vscode.ThemeIcon('pass', new vscode.ThemeColor('charts.green'));
    case 'pre_plan_completed':
      return new vscode.ThemeIcon('pass', new vscode.ThemeColor('charts.green'));
    case 'planned':
      return new vscode.ThemeIcon('warning', new vscode.ThemeColor('charts.yellow'));
    case 'cost_estimated':
      return new vscode.ThemeIcon('info', new vscode.ThemeColor('charts.orange'));
    case 'policy_override':
      return new vscode.ThemeIcon('warning', new vscode.ThemeColor('charts.yellow'));
    case 'policy_checked':
      return new vscode.ThemeIcon('pass', new vscode.ThemeColor('charts.green'));
    case 'confirmed':
      return new vscode.ThemeIcon('pass', new vscode.ThemeColor('charts.green'));
    case 'post_plan_completed':
      return new vscode.ThemeIcon('pass', new vscode.ThemeColor('charts.green'));
    case 'planned_and_finished':
      return new vscode.ThemeIcon('pass-filled', new vscode.ThemeColor('charts.green'));
    case 'policy_soft_failed':
      return new vscode.ThemeIcon('warning', new vscode.ThemeColor('charts.yellow'));
    case 'applied':
      return new vscode.ThemeIcon('pass-filled', new vscode.ThemeColor('charts.green'));
    case 'discarded':
      return new vscode.ThemeIcon('close', new vscode.ThemeColor('charts.gray'));
    case 'canceled':
      return new vscode.ThemeIcon('error', new vscode.ThemeColor('charts.gray'));
    case 'force_canceled':
      return new vscode.ThemeIcon('error');
    case 'errored':
      return new vscode.ThemeIcon('error', new vscode.ThemeColor('charts.red'));
  }

  return new vscode.ThemeIcon('dash');
}

export function GetRunStatusMessage(status?: string): string {
  switch (status) {
    // in progress
    case 'pending':
      return 'Pending';
    case 'fetching':
      return 'Fetching';
    case 'queuing':
      return 'Queuing';
    case 'planning':
      return 'Planning';
    case 'cost_estimating':
      return 'Estimating costs';
    case 'policy_checking':
      return 'Checking policies';
    case 'apply_queued':
      return 'Apply queued';
    case 'applying':
      return 'Applying';
    case 'post_plan_running':
      return 'Tasks - post-plan (running)';
    case 'plan_queued':
      return 'Plan queued';
    case 'fetching_completed':
      return 'Fetching completed';
    case 'pre_plan_running':
      return 'Tasks - pre-plan (running)';
    case 'pre_plan_completed':
      return 'Tasks - pre-plan (passed)';
    case 'planned':
      return 'Planned';
    case 'cost_estimated':
      return 'Cost estimated';
    case 'policy_override':
      return 'Policy override';
    case 'policy_checked':
      return 'Policy checked';
    case 'confirmed':
      return 'Confirmed';
    case 'post_plan_completed':
      return 'Tasks - post-plan (passed)';
    case 'planned_and_finished':
      return 'Planned and finished';
    case 'policy_soft_failed':
      return 'Policy Soft Failure';
    case 'applied':
      return 'Applied';
    case 'discarded':
      return 'Discarded';
    case 'canceled':
      return 'Canceled';
    case 'force_canceled':
      return 'Force canceled';
    case 'errored':
      return 'Errored';
  }

  return 'No runs available';
}

export function RelativeTimeFormat(d: Date): string {
  const SECONDS_IN_MINUTE = 60;
  const SECONDS_IN_HOUR = SECONDS_IN_MINUTE * 60;
  const SECONDS_IN_DAY = SECONDS_IN_HOUR * 24;
  const SECONDS_IN_WEEK = SECONDS_IN_DAY * 7;
  const SECONDS_IN_MONTH = SECONDS_IN_DAY * 30;
  const SECONDS_IN_YEAR = SECONDS_IN_DAY * 365;

  const rtf = new Intl.RelativeTimeFormat('en', { style: 'long', numeric: 'auto' });
  const nowSeconds = Date.now() / 1000;
  const seconds = d.getTime() / 1000;
  const diffSeconds = nowSeconds - seconds;

  if (diffSeconds < SECONDS_IN_MINUTE) {
    return rtf.format(-diffSeconds, 'second');
  }
  if (diffSeconds < SECONDS_IN_HOUR) {
    const minutes = Math.round(diffSeconds / SECONDS_IN_MINUTE);
    return rtf.format(-minutes, 'minute');
  }
  if (diffSeconds < SECONDS_IN_DAY) {
    const hours = Math.round(diffSeconds / SECONDS_IN_HOUR);
    return rtf.format(-hours, 'hour');
  }
  if (diffSeconds < SECONDS_IN_WEEK) {
    const days = Math.round(diffSeconds / SECONDS_IN_DAY);
    return rtf.format(-days, 'day');
  }
  if (diffSeconds < SECONDS_IN_MONTH) {
    const weeks = Math.round(diffSeconds / SECONDS_IN_WEEK);
    return rtf.format(-weeks, 'week');
  }
  if (diffSeconds < SECONDS_IN_YEAR) {
    const months = Math.round(diffSeconds / SECONDS_IN_MONTH);
    return rtf.format(-months, 'month');
  }
  const years = diffSeconds / SECONDS_IN_YEAR;
  return rtf.format(-years, 'year');
}
