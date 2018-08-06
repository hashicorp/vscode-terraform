import { Range } from "./range";

export enum DiagnosticSeverity {
  ERROR,
  WARNING
}

export class Diagnostic {
  constructor(readonly range: Range, readonly message: string, readonly severity: DiagnosticSeverity) { }
}