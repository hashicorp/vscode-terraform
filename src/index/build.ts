import * as vscode from 'vscode';
import { Ast, AstItem, AstVal, NodeType, VisitedNode, walk } from './ast';
import { FileIndex } from './file-index';
import { ParseError, parseHilWithPosition } from './hcl-hil';
import { Reference } from './reference';
import { Section } from './section';

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

    if (isTypedSection || sectionType === "module") {
        if (isTypedSection) {
            nameIndex = 2;
            type = stripQuotes(item.Keys[1].Token.Text);
            const typeStart = createPosition(item.Keys[1].Token.Pos, 1);
            const typeEnd = typeStart.translate({ characterDelta: type.length });
            typeLoc = new vscode.Location(uri, new vscode.Range(typeStart, typeEnd));
        } else {
            let listItem = item.Val.List.Items;
            for (let list of listItem) {
                if (list.Keys[0].Token.Text === "source") {
                    type = stripQuotes(list.Val.Token.Text);
                    const typeStart = createPosition(list.Val.Token.Pos, 1);
                    const typeEnd = typeStart.translate({ characterDelta: type.length });
                    typeLoc = new vscode.Location(uri, new vscode.Range(typeStart, typeEnd));
                    break;
                }
            }
        }
    }

    const name = stripQuotes(item.Keys[nameIndex].Token.Text);
    const nameStart = createPosition(item.Keys[nameIndex].Token.Pos, 1);
    const nameStop = nameStart.translate({ characterDelta: name.length });
    const nameLoc = new vscode.Location(uri, new vscode.Range(nameStart, nameStop));

    const location = new vscode.Location(uri, createRange(item.Keys[0].Token.Pos, item.Val.Rbrace));

    return new Section(sectionType, type, typeLoc, name, nameLoc, location, item);
}

function endPosFromVal(val: AstVal): vscode.Position {
    if (val.Rbrace || val.Rbrack)
        return createPosition(val.Rbrace || val.Rbrack, 1); // for maps/lists

    return createPosition(val.Token.Pos, val.Token.Text.length); // for strings
}

function sectionFromSingleKeyItemNode(uri: vscode.Uri, item: any): Section {
    let type: string = null;
    let typeLoc: vscode.Location = null;

    const name = item.Keys[0].Token.Text;
    const nameStart = createPosition(item.Keys[0].Token.Pos);
    const nameStop = nameStart.translate({ characterDelta: name.length });
    const nameLoc = new vscode.Location(uri, new vscode.Range(nameStart, nameStop));

    const location = new vscode.Location(uri, new vscode.Range(createPosition(item.Keys[0].Token.Pos), endPosFromVal(item.Val)));

    return new Section("local", null, null, name, nameLoc, location, item);
}

function assignmentFromItemNode(uri: vscode.Uri, item: any): Reference {
    const name = item.Keys[0].Token.Text;

    const start = createPosition(item.Keys[0].Token.Pos);
    const end = endPosFromVal(item.Val);

    const location = new vscode.Location(uri, new vscode.Range(start, end));

    let reference = new Reference(`var.${name}`, location, null);
    reference.nameRange = new vscode.Range(start, start.translate({ characterDelta: name.length }));

    return reference;
}

function* walkHil(uri: vscode.Uri, exprs: any[], currentSection: Section): Iterable<Reference> {
    for (let expr of exprs) {
        if (expr.Name && expr.Posx) {
            let name = expr.Name as string;

            // for now ignore self. and count.
            if (name.startsWith("self.") || name.startsWith("count.")) {
                return;
            }
            let range = new vscode.Range(expr.Posx.Line - 1, expr.Posx.Column - 1,
                expr.Posx.Line - 1, expr.Posx.Column - 1 + name.length);
            let location = new vscode.Location(uri, range);
            let reference = new Reference(expr.Name, location, currentSection);
            yield reference;
        }
        if (expr.Key) {
            yield* walkHil(uri, [expr.Key], currentSection);
        }
        if (expr.Target) {
            yield* walkHil(uri, [expr.Target], currentSection);
        }
        if (expr.Args) {
            yield* walkHil(uri, expr.Args as any[], currentSection);
        }
    }
}

function extractReferencesFromHil(uri: vscode.Uri, token: any, currentSection: Section): [Reference[], ParseError] {
    let [hil, error] = parseHilWithPosition(token.Text, token.Pos.Column, token.Pos.Line, token.Filename);

    if (error) {
        return [null, new ParseError(token, error.message)];
    }

    if (!hil.Exprs) {
        // no expressions found in the HIL
        return [[], null];
    }

    return [[...walkHil(uri, hil.Exprs, currentSection)], null];
}

function childOfLocalsSection(p: VisitedNode[]): boolean {
    if (p.length < 3)
        return false;

    if (p[p.length - 3].type !== NodeType.Item)
        return false;

    const item = p[p.length - 3].node as AstItem;
    if (item.Keys.length === 0)
        return false;

    return item.Keys[0].Token.Text === "locals";
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
            // detect variable assignments
            if (node.Keys.length === 1) {
                // handle top-level things
                if (path.length === 2) {
                    // assignment nodes (like we want) have an actual valid assignment
                    // position, whereas single key sections (like terraform, locals)
                    // do not
                    if (node.Assign.Line === 0 && node.Assign.Column === 0)
                        return;

                    // TODO: we should part move this parsing into a separate
                    //       parser which only handles tfvars files
                    // only top-level assignments
                    let assignment = assignmentFromItemNode(uri, node);
                    if (assignment) {
                        result.assignments.push(assignment);
                    }
                    return;
                } else {
                    if (childOfLocalsSection(path)) {
                        currentDepth = path.length;
                        currentSection = sectionFromSingleKeyItemNode(uri, node);
                        return;
                    }
                }
            }

            // detect section
            if (node.Keys.length === 2 || node.Keys.length === 3) {
                if (currentSection) {
                    result.add(currentSection);
                }

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
                    const range = new vscode.Range(error.line, error.column, error.line, node.Token.Pos.Column - 1 + node.Token.Text.length);
                    let message = error.message;
                    if (!message) {
                        message = "Could not parse expression";
                    }

                    message = message.replace(/^parse error at undefined:[0-9]+:[0-9]+:\s+/, '');
                    const diagnostic = new vscode.Diagnostic(range, message, vscode.DiagnosticSeverity.Error);
                    result.diagnostics.push(diagnostic);
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