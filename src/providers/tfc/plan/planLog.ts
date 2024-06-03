import { Change, ChangeSummary, Diagnostic, DriftSummary, Outputs } from '../../../api/terraformCloud/log';
import { DiagnosticSummary } from '../logHelpers';

export interface PlanLog {
  plannedChanges?: Change[];
  changeSummary?: ChangeSummary;
  driftChanges?: Change[];
  driftSummary?: DriftSummary;
  outputs?: Outputs;
  diagnostics?: Diagnostic[];
  diagnosticSummary?: DiagnosticSummary;
}
