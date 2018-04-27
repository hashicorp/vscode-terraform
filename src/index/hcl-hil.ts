import { Ast } from "./ast";

const hcl = require('../hcl-hil.js');

export class ParseError extends Error {
  readonly fileName: string;
  readonly offset: number;
  readonly column: number;
  readonly line: number;

  constructor(node: any, message?: string) {
    super(message);

    this.fileName = node.Pos.Filename;
    this.offset = node.Pos.Offset;
    this.line = node.Pos.Line - 1;
    this.column = node.Pos.Column - 1;
  }
}

export function parseHcl(document: string): [Ast, ParseError] {
  let result = hcl.parseHcl(document);

  if (result[1]) {
    return [null, new ParseError(result[1], result[1].Err)];
  }

  return [result[0] as Ast, null];
}

export function parseHilWithPosition(document: string, column: number, line: number, fileName: string): [any, ParseError] {
  let result = hcl.parseHil(document, column, line, fileName);

  if (result[1]) {
    return [null, new ParseError(result[1], result[1].Err)];
  }

  return [result[0], null];
}