import * as vscode from 'vscode';
import { DiagnosticSeverity } from './diagnostic';
import { Location } from './location';
import { Position } from './position';
import { Range } from './range';

export function to_vscode_Position(pos: Position): vscode.Position {
  return new vscode.Position(pos.line, pos.character);
}

export function to_vscode_Range(range: Range): vscode.Range {
  return new vscode.Range(
    to_vscode_Position(range.start),
    to_vscode_Position(range.end)
  );
}

export function to_vscode_Location(location: Location): vscode.Location {
  return new vscode.Location(
    location.uri,
    to_vscode_Range(location.range)
  );
}

export function from_vscode_Position(pos: vscode.Position): Position {
  return new Position(pos.line, pos.character);
}

export function to_vscode_DiagnosticsSeverity(severity: DiagnosticSeverity) {
  switch (severity) {
    case DiagnosticSeverity.ERROR:
      return vscode.DiagnosticSeverity.Error;
    case DiagnosticSeverity.WARNING:
      return vscode.DiagnosticSeverity.Warning;
  }

  return vscode.DiagnosticSeverity.Error;
}
