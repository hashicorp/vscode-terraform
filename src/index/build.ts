
import { FileIndex, UntypedSection, TypedSection, Section, Reference } from './index';
import { walk, NodeType } from './ast';
import { Ast, parseHilWithPosition, ParseError } from './hcl-hil';

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

function untypedSectionFromKeyItemNode(uri: vscode.Uri, item: any): UntypedSection {
    const type = item.Keys[0].Token.Text;

    const name = stripQuotes(item.Keys[1].Token.Text);

    const nameStart = createPosition(item.Keys[1].Token.Pos, 1);
    const nameStop = nameStart.translate({ characterDelta: name.length });
    const nameLoc = new vscode.Location(uri, new vscode.Range(nameStart, nameStop));

    const location = new vscode.Location(uri, createRange(item.Keys[0].Token.Pos, item.Val.Rbrace));
    return new UntypedSection(type, name, nameLoc, location);
}

function typedSectionFromKeyItemNode(uri: vscode.Uri, item: any): TypedSection {
    const sectionType = item.Keys[0].Token.Text;

    const type = stripQuotes(item.Keys[1].Token.Text);
    const typeStart = createPosition(item.Keys[1].Token.Pos, 1);
    const typeEnd = typeStart.translate({ characterDelta: type.length });
    const typeLoc = new vscode.Location(uri, new vscode.Range(typeStart, typeEnd));

    const name = stripQuotes(item.Keys[2].Token.Text);
    const nameStart = createPosition(item.Keys[2].Token.Pos, 1);
    const nameStop = nameStart.translate({ characterDelta: name.length });
    const nameLoc = new vscode.Location(uri, new vscode.Range(nameStart, nameStop));

    const location = new vscode.Location(uri, createRange(item.Keys[0].Token.Pos, item.Val.Rbrace));

    return new TypedSection(sectionType, type, typeLoc, name, nameLoc, location);
}

function* walkHil(uri: vscode.Uri, exprs: Array<any>): Iterable<Reference> {
    for (let expr of exprs) {
        if (expr.Name && expr.Posx) {
            let name = expr.Name as string;
            let range = new vscode.Range(expr.Posx.Line - 1, expr.Posx.Column - 1,
                expr.Posx.Line - 1, expr.Posx.Column - 1 + name.length);
            let location = new vscode.Location(uri, range);
            let reference = new Reference(expr.Name, location);
            yield reference;
        } else if (expr.Args) {
            walkHil(uri, expr.Args as Array<any>);
        }
    }
}

function extractReferencesFromHil(uri: vscode.Uri, token: any): [Reference[], ParseError] {
    let [hil, error] = parseHilWithPosition(token.Text, token.Pos.Column, token.Pos.Line, token.Filename);

    if (error) {
        // TODO: put somewhere
        return [null, new ParseError(token, "Expression parse error")];
    }

    return [[...walkHil(uri, hil.Exprs)], null];
}

export function build(uri: vscode.Uri, ast: Ast): FileIndex {
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
            if (node.Keys.length === 2) {
                currentDepth = path.length;
                currentSection = untypedSectionFromKeyItemNode(uri, node);
                return;
            }

            if (node.Keys.length === 3) {
                currentDepth = path.length;
                currentSection = typedSectionFromKeyItemNode(uri, node);
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
                let [references, error] = extractReferencesFromHil(uri, node.Token);

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