
import { FileIndex, Section, Reference } from './index';
import { walk, NodeType, Ast } from './ast';
import { parseHilWithPosition, ParseError } from './hcl-hil';

import * as vscode from 'vscode';

function stripQuotes(text: string): string {
    return text.substr(1, text.length - 2);
}

function createPosition(pos: any, columnDelta: number = 0): vscode.Position {
    return new vscode.Position(pos.Line - 1, pos.Column - 1 + columnDelta);
}

function createRange(start: any, end: any): vscode.Range {
    return new vscode.Range(createPosition(start), createPosition(end));
}

function createLocation(uri: vscode.Uri): vscode.Location {
    return null;
}

function sectionFromKeyItemNode(uri: vscode.Uri, item: any): Section {
    const isTypedSection = item.Keys.length === 3;

    const sectionType = item.Keys[0].Token.Text;

    let type: string = null;
    let typeLoc: vscode.Location = null;

    // typed section has name at index 2, untyped at 1
    let nameIndex = 1;

    if (isTypedSection) {
        nameIndex = 2;

        type = stripQuotes(item.Keys[1].Token.Text);
        const typeStart = createPosition(item.Keys[1].Token.Pos, 1);
        const typeEnd = typeStart.translate({ characterDelta: type.length });
        typeLoc = new vscode.Location(uri, new vscode.Range(typeStart, typeEnd));
    }

    const name = stripQuotes(item.Keys[nameIndex].Token.Text);
    const nameStart = createPosition(item.Keys[nameIndex].Token.Pos, 1);
    const nameStop = nameStart.translate({ characterDelta: name.length });
    const nameLoc = new vscode.Location(uri, new vscode.Range(nameStart, nameStop));

    const location = new vscode.Location(uri, createRange(item.Keys[0].Token.Pos, item.Val.Rbrace));

    return new Section(sectionType, type, typeLoc, name, nameLoc, location, item);
}

function* walkHil(uri: vscode.Uri, exprs: any[], currentSection: Section): Iterable<Reference> {
    for (let expr of exprs) {
        if (expr.Name && expr.Posx) {
            let name = expr.Name as string;
            let range = new vscode.Range(expr.Posx.Line - 1, expr.Posx.Column - 1,
                expr.Posx.Line - 1, expr.Posx.Column - 1 + name.length);
            let location = new vscode.Location(uri, range);
            let reference = new Reference(expr.Name, location, currentSection);
            yield reference;
        } else if (expr.Args) {
            walkHil(uri, expr.Args as any[], currentSection);
        }
    }
}

function extractReferencesFromHil(uri: vscode.Uri, token: any, currentSection: Section): [Reference[], ParseError] {
    let [hil, error] = parseHilWithPosition(token.Text, token.Pos.Column, token.Pos.Line, token.Filename);

    if (error) {
        // TODO: put somewhere
        return [null, new ParseError(token, "Expression parse error")];
    }

    if (!hil.Exprs) {
        // no expressions found in the HIL
        return [[], null];
    }

    return [[...walkHil(uri, hil.Exprs, currentSection)], null];
}

export function build(uri: vscode.Uri, ast: Ast): FileIndex {
    if (!ast) {
        throw "ast cannot be null";
    }

    let result = new FileIndex(uri);

    let currentSection: Section = null;
    let currentDepth = 0;
    walk(ast, (type, node, path, index, array) => {
        if (path.length === currentDepth && currentSection) {
            // push section into index
            currentDepth = 0;
            result.add(currentSection);

            currentSection = null;
        }

        if (type === NodeType.Item) {
            // detect section
            if (node.Keys.length === 2 || node.Keys.length === 3) {
                currentDepth = path.length;
                currentSection = sectionFromKeyItemNode(uri, node);
                return;
            }
        }

        if (type === NodeType.Value) {
            // we can later use path to go up and detect what type
            // of value we are currently processing but right now we are
            // only using it to collect references
            //
            // the AST contains chains like this Val > Keys > Items > [Val > Token.Type==9]
            // we only care about the second Val in the above example, we use
            // Token.Type==9 to detect it
            if (node.Token && node.Token.Type === 9) {
                if (!currentSection) {
                    // TODO: this happens in tfvars files, should probably handle those
                    return;
                }

                let [references, error] = extractReferencesFromHil(uri, node.Token, currentSection);

                if (error) {
                    // TODO: handle
                    return;
                }

                currentSection.references.push(...references);
                return;
            }
        }
    });

    // handle last section
    if (currentSection) {
        result.add(currentSection);
    }

    return result;
}