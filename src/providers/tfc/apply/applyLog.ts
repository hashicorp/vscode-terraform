import { AppliedChange, ChangeSummary, Diagnostic, Outputs } from '../../../api/terraformCloud/log';
import { DiagnosticSummary } from '../logHelpers';

export interface ApplyLog {
  appliedChanges?: AppliedChange[];
  changeSummary?: ChangeSummary;
  outputs?: Outputs;
  diagnostics?: Diagnostic[];
  diagnosticSummary?: DiagnosticSummary;
}
