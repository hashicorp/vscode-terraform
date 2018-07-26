import Uri from 'vscode-uri';
import { Range } from "./range";

export class Location {
  constructor(readonly uri: Uri, readonly range: Range) { }
}