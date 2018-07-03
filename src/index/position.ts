export class Position {
  constructor(readonly _line: number, readonly _character: number) { }

  get line(): number {
    return this._line;
  }

  get character(): number {
    return this._character;
  }

  isBefore(other: Position): boolean {
    if (this._line < other._line) {
      return true;
    }
    if (other._line < this._line) {
      return false;
    }
    return this._character < other._character;
  }

  translate(delta: { lineDelta?: number, characterDelta?: number }): Position {
    if (delta.lineDelta === undefined)
      delta.lineDelta = 0;

    if (delta.characterDelta === undefined)
      delta.characterDelta = 0;

    return new Position(this.line + delta.lineDelta, this.character + delta.characterDelta);
  }
}