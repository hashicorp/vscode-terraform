
let hcl = require('../hcl-hil.js');

export function walk(node: any, visitor) {
    visitor(node);

    if (node.hasOwnProperty("Node")) {
        walk(node.Node, visitor);
    } else if (node.hasOwnProperty("Items")) {
        node.Items.forEach(element => walk(element, visitor));
    } else if (node.hasOwnProperty("Keys")) {
        node.Keys.forEach(element => walk(element, visitor));
        if (node.Val)
            walk(node.Val, visitor);
    } else if (node.hasOwnProperty("List")) {
        node.List.forEach(element => walk(element, visitor));
    }
}

export function parseHcl(document: string): any {
    let ast = hcl.parseHcl(document);

    return ast;
}