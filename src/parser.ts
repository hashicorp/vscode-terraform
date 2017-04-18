import * as vscode from 'vscode';

export namespace Parser {

  export interface Location {
    Filename: string;
    Offset: number;
    Line: number; // starts at 1
    Column: number; // starts at 1
  }

  export interface ParseError {
    Message: string;
    Location: Location;
  }

  export interface Variable {
    Name: string;
    Location: Location;
  }

  export interface Resource {
    Name: string;
    Type: string;
    Location: Location;
  }

  export interface Output {
    Name: string;
    Location: Location;
  }

  export interface Reference {
    Name: string;
    Locations: Location[];
  }

  export interface IndexResult {
    Errors: ParseError[];
    Variables: Variable[];
    Resources: Resource[];
    Outputs: Output[];
    References: { [targetId: string]: Reference };
  }

  export function parseIndex(json: string): IndexResult {
    return <IndexResult>JSON.parse(json);
  }

  export function locationToRange(location: Location): vscode.Range {
    const magic = Number.MAX_VALUE;
    return new vscode.Range(location.Line - 1, location.Column - 1,
      location.Line - 1, magic);
  }

  export function locationToLocation(location: Location, uri?: vscode.Uri): vscode.Location {
    if (uri === undefined) {
      uri = vscode.Uri.file(location.Filename);
    }

    return {
      uri: uri,
      range: locationToRange(location)
    }
  }

}