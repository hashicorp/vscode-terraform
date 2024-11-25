/**
 * Copyright (c) HashiCorp, Inc.
 * SPDX-License-Identifier: MPL-2.0
 */

// See https://developer.hashicorp.com/terraform/internals/machine-readable-ui
export interface LogLine {
  '@level': string;
  '@message': string;
  '@module': string;
  '@timestamp': string;
  type: MessageType;

  // type=planned_change | type=resource_drift
  change?: Change;
  // type=apply_start | type=apply_progress | type=apply_complete | type=apply_errored
  hook?: AppliedChange;
  // type=change_summary
  changes?: ChangeSummary;
  // type=outputs
  outputs?: Outputs;
  // type=diagnostic
  diagnostic?: Diagnostic;
}

export type MessageType =
  // Generic Messages
  | 'version'
  | 'log'
  | 'diagnostic'
  // Operation Results
  | 'resource_drift'
  | 'planned_change'
  | 'change_summary'
  | 'outputs'
  // Resource Progress
  | 'apply_start'
  | 'apply_progress'
  | 'apply_complete'
  | 'apply_errored'
  | 'provision_start'
  | 'provision_progress'
  | 'provision_complete'
  | 'provision_errored'
  | 'refresh_start'
  | 'refresh_complete'
  // Ephemeral progress
  | 'ephemeral_op_start'
  | 'ephemeral_op_complete'
  | 'ephemeral_op_errored'
  // Test Results
  | 'test_abstract'
  | 'test_file'
  | 'test_run'
  | 'test_cleanup'
  | 'test_summary'
  | 'test_plan'
  | 'test_state'
  | 'test_interrupt'
  // Version Message
  | 'terraform'
  | 'ui';

export interface Change {
  resource: Resource;
  previous_resource?: Resource;
  action: ChangeAction;
  reason?: ChangeReason;
  importing?: Importing;
}

export interface AppliedChange {
  resource: Resource;
  action: ChangeAction;
  elapsed_seconds: number;
  id_key?: string;
  id_value?: string;
}

export type ChangeAction = 'noop' | 'create' | 'read' | 'update' | 'replace' | 'delete' | 'move' | 'import';

export type ChangeReason =
  | 'tainted'
  | 'requested'
  | 'replace_triggered_by'
  | 'cannot_update'
  | 'unknown'
  | 'delete_because_no_resource_config'
  | 'delete_because_wrong_repetition'
  | 'delete_because_count_index'
  | 'delete_because_each_key'
  | 'delete_because_no_module'
  | 'delete_because_no_move_target'
  | 'read_because_config_unknown'
  | 'read_because_dependency_pending'
  | 'read_because_check_nested';

interface Importing {
  id: string;
}
export interface Resource {
  addr: string; // module.workspaces.random_pet.cluster_name[2]
  module?: string; // module.workspaces
  resource: string; // random_pet.cluster_name[2]
  implied_provider: string; // random
  resource_type: string; // random_pet
  resource_name: string; // cluster_name
  resource_key: number; // 2
}

export interface ChangeSummary {
  add: number;
  change: number;
  import: number;
  operation: OperationType;
  remove: number;
}

export interface DriftSummary {
  changed: number;
  deleted: number;
}

type OperationType = 'plan' | 'apply' | 'destroy';

export interface Outputs {
  [key: string]: OutputChange;
}

export interface OutputChange {
  action?: ChangeAction; // only present in plan logs, not apply logs
  sensitive: boolean;
}

export interface Diagnostic {
  summary: string;
  severity: DiagnosticSeverity;
  detail: string;
}

export type DiagnosticSeverity = 'warning' | 'error';
