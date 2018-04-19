
let hcl = require('../hcl-hil.js');

export enum NodeType {
    Unknown,
    Node,
    Item,
    Key,
    Value,
    List
}

export type VisitorFunc = (type: NodeType, node: any, path: VisitedNode[], index?: number, array?: any[]) => void;
export type VisitedNode = {type: NodeType, node: any};

function walkInternal(node: any, visitor: VisitorFunc, type: NodeType, path: VisitedNode[], index?: number, array?: any[]) {
    visitor(type, node, path, index, array);
    const current = {type: type, node: node};

    if (node.hasOwnProperty("Node")) {
        walkInternal(node.Node, visitor, NodeType.Node, path.concat(current));
    } else if (node.hasOwnProperty("Items")) {
        node.Items.forEach((item, idx, items) => {
            walkInternal(item, visitor, NodeType.Item, path.concat(current), idx, items);
        });
    } else if (node.hasOwnProperty("Keys")) {
        node.Keys.forEach((key, idx, keys) => {
            walkInternal(key, visitor, NodeType.Key, path.concat(current), idx, keys);
        });
        if (node.Val)
            walkInternal(node.Val, visitor, NodeType.Value, path.concat(current));
    } else if (node.hasOwnProperty("List")) {
        walkInternal(node.List, visitor, NodeType.List, path.concat(current));
    }
}

export function walk(node: any, visitor: VisitorFunc) {
    return walkInternal(node, visitor, NodeType.Unknown, []);
}

export function parseHcl(document: string): any {
    let ast = hcl.parseHcl(document);

    return ast;
}