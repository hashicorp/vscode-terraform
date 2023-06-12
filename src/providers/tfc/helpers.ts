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
