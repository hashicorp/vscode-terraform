import { Range } from "./range";
import { Uri } from "./uri";

export class Location {
  constructor(readonly uri: Uri, readonly range: Range) { }
}