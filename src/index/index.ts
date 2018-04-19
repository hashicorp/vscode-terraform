
import * as vscode from 'vscode';

export class TypedSection {
    constructor(
        readonly SectionType: string,
        readonly Type: string,
        readonly TypeLocation: vscode.Location,
        readonly Name: string,
        readonly NameLocation: vscode.Location,
        readonly Location: vscode.Location) { }
}

export class UntypedSection {
    constructor(
        readonly SectionType: string,
        readonly Name: string,
        readonly NameLocation: vscode.Location,
        readonly Location: vscode.Location) { }
}

export class Index {
    TypedSections: TypedSection[] = [];
    UntypedSections: UntypedSection[] = [];
}