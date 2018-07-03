import { Position } from "./position";

export class Range {
  constructor(readonly _start: Position, readonly _end: Position) { }

  get start(): Position {
    return this._start;
  }

  get end(): Position {
    return this._end;
  }

  contains(p: Position): boolean {
    return this._start.isBefore(p) && p.isBefore(this._end);
  }
}