
export enum NodeType {
    Unknown = "UNKNOWN",
    Node = "NODE",
    Item = "ITEM",
    Key = "KEY",
    Value = "VALUE",
    List = "LIST"
}

export type VisitorFunc = (type: NodeType, node: any, path: VisitedNode[], index?: number, array?: any[]) => void;
export type VisitedNode = { type: NodeType, node: any };

function walkInternal(node: any, visitor: VisitorFunc, type: NodeType, path: VisitedNode[], index?: number, array?: any[]) {
    visitor(type, node, path, index, array);
    const current = [{ type: type, node: node }];

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
    } else if (type === NodeType.List) {
        // value list
        node.forEach((value, idx, values) => {
            walkInternal(value, visitor, NodeType.Value, path.concat(current), idx, values);
        });
    }
}

export function walk(ast: Ast, visitor: VisitorFunc) {
    return walkInternal(ast, visitor, NodeType.Unknown, []);
}

export interface Ast {
    Node: AstList;
}

export interface AstPosition {
    Filename: string;
    Offset: number;
    Line: number;
    Column: number;
}

export interface AstToken {
    Type: number;
    Pos: AstPosition;
    Text: string;
    JSON: boolean;
}

export interface AstList {
    Items: AstItem[];
}

export interface AstTokenItem {
    Token: AstToken;
    LeadComment: any;
    LineComment: any;
}

export interface AstVal {
    Lbrace: AstPosition | null;
    Rbrace: AstPosition | null;
    Lbrack: AstPosition | null;
    Rbrack: AstPosition | null;
    List?: AstList | AstTokenItem[];
    Token?: AstToken;
    LeadComment: any;
    LineComment: any;
}

export interface AstKey {
    Token: AstToken;
}

export interface AstItem {
    Keys: AstKey[];
    Assign: AstPosition;
    Val: AstVal,
    LeadComment: any;
    LineComment: any;
}

export function getText(token: AstToken, options?: { stripQuotes: boolean }): string {
    if (options && options.stripQuotes) {
        if (token.Type === 9) {
            return token.Text.substr(1, token.Text.length - 2);
        }
    }

    return token.Text;
}

export function getStringValue(value: AstVal, fallback: string, options?: { stripQuotes: boolean }): string {
    if (!value)
        return fallback;

    if (value.Token)
        return getText(value.Token, options);

    return fallback;
}

export function getMapValue(value: AstVal, options?: { stripQuotes: boolean }): Map<string, string> {
    let astList = value.List as AstList;
    let map = new Map<string, string>();

    if (!astList || !astList.Items)
        return map;
    astList.Items.forEach((item) => {
        let k = getText(item.Keys[0].Token);
        let v = getStringValue(item.Val, undefined, options);

        if (v !== undefined) {
            map.set(k, v);
        }
    });
    return map;
}

export function getValue(value: AstVal, options?: { stripQuotes: boolean }): string | string[] | Map<string, string> {
    if (value.Token)
        return getText(value.Token, options);

    // map
    let astList = value.List as AstList;
    if (astList.Items) {
        return getMapValue(value, options);
    }

    // array
    let tokens = value.List as AstTokenItem[];
    return tokens.map((t) => getText(t.Token, options));
}

export function findValue(item: AstItem, name?: string): AstVal {
    if (!name) {
        return item.Val;
    }

    let values = (item.Val.List as AstList).Items;
    if (!values) {
        return null;
    }

    let value = values.find((v) => getText(v.Keys[0].Token) === name);
    if (!value)
        return null;
    return value.Val;
}

function count(haystack: string, character: string): number {
    let result = 0;
    for (let i = 0; i < haystack.length; i++) {
        if (haystack[i] === character)
            result++;
    }
    return result;
}

export function getTokenAtPosition(ast: Ast, pos: AstPosition): AstToken {
    let found: AstToken = null;
    walk(ast, (type: NodeType, node: any, path: VisitedNode[]) => {
        if (node.Token && path.findIndex((n) => n.type === NodeType.Value) !== -1) {
            let token = node.Token as AstToken;
            if (token.Type === 9) {
                // string
                if (pos.Line !== token.Pos.Line)
                    return;

                if (token.Pos.Column < pos.Column && (token.Pos.Column + token.Text.length) > pos.Column) {
                    found = token;
                }
            } else if (token.Type === 10) {
                // heredoc
                const numLines = count(token.Text, '\n');
                if (pos.Line > token.Pos.Line && pos.Line < (token.Pos.Line + numLines)) {
                    found = token;
                }
            }

        }
    });
    return found;
}