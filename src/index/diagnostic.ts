import { Range } from "./range";

export enum DiagnosticSeverity {
  ERROR
}

export class Diagnostic {
  constructor(readonly range: Range, readonly message: string, readonly severity: DiagnosticSeverity) { }
}