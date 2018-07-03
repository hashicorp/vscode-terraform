import * as vscode from 'vscode';
import { Location } from './location';
import { Position } from './position';
import { Range } from './range';
import { Uri } from './uri';

export function to_vscode_Uri(uri: Uri): vscode.Uri {
  return vscode.Uri.parse(uri.toString());
}

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
    to_vscode_Uri(location.uri),
    to_vscode_Range(location.range)
  );
}

export function from_vscode_Uri(uri: vscode.Uri): Uri {
  return Uri.parse(uri.toString());
}

export function from_vscode_Position(pos: vscode.Position): Position {
  return new Position(pos.line, pos.character);
}
