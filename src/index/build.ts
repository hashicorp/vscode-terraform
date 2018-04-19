
import { Index, UntypedSection, TypedSection } from './index';
import { walk, NodeType } from './parser';

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

export function build(uri: vscode.Uri, ast: any): Index {
    let result = new Index();

    walk(ast, (type, node, path, index, array) => {
        if (type === NodeType.Item) {
            if (node.Keys.length === 2) {
                result.UntypedSections.push(untypedSectionFromKeyItemNode(uri, node));
            }

            if (node.Keys.length === 3) {
                result.TypedSections.push(typedSectionFromKeyItemNode(uri, node));
            }
        }
    });

    return result;
}