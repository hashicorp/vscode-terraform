const hcl = require('../hcl-hil.js');

export interface Ast {
  Node: any;
}

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

export function parseHcl(document: string): Ast {
  let result = hcl.parseHcl(document);

  if (result[1]) {
    throw new ParseError(result[1]);
  }

  return result[0] as Ast;
}