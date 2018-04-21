const hcl = require('../hcl-hil.js');

export interface Ast {
  Node: any;
}

export function parseHcl(document: string): Ast {
  let result = hcl.parseHcl(document);

  if (result[1]) {
    throw new Error("parse error");
  }

  return result[0] as Ast;
}