
let hcl = require('../hcl-hil.js');



export function parseHcl(document: string): any {
    let ast = hcl.parseHcl(document);

    return ast;
}