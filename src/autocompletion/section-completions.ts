import * as vscode from 'vscode';

function variableCompletion(): vscode.CompletionItem {
    let item = new vscode.CompletionItem("variable", vscode.CompletionItemKind.Variable);
    let snippet = 'variable "${1:name}" {\n' +
        '  default = ${2:value}\n' +
        '}\n';
    item.insertText = new vscode.SnippetString(snippet);
    return item;
}

function outputCompletion(): vscode.CompletionItem {
    let item = new vscode.CompletionItem("output", vscode.CompletionItemKind.Variable);
    let snippet = 'output "${1:name}" {\n' +
        '  default = ${2:value}\n' +
        '}\n';
    item.insertText = new vscode.SnippetString(snippet);
    return item;
}

function resourceCompletion(): vscode.CompletionItem {
    let item = new vscode.CompletionItem("resource", vscode.CompletionItemKind.Interface);
    let snippet = 'resource "${1:type}" "${2:type}" {\n' +
        '  $0\n' +
        '}\n';
    item.insertText = new vscode.SnippetString(snippet);
    return item;
}

function dataCompletion(): vscode.CompletionItem {
    let item = new vscode.CompletionItem("data", vscode.CompletionItemKind.Interface);
    let snippet = 'data "${1:type}" "${2:name}" {\n' +
        '  $0\n' +
        '}\n';
    item.insertText = new vscode.SnippetString(snippet);
    return item;
}

function localsCompletion(): vscode.CompletionItem {
    let item = new vscode.CompletionItem("locals", vscode.CompletionItemKind.Class);
    let snippet = 'locals {\n' +
        '  $0\n' +
        '}\n';
    item.insertText = new vscode.SnippetString(snippet);
    return item;
}

function moduleCompletion(): vscode.CompletionItem {
    let item = new vscode.CompletionItem("module", vscode.CompletionItemKind.Module);
    let snippet = 'module "${1:name}" {\n' +
        '  source = "${2:source}"\n' +
        '  $0\n' +
        '}\n';
    item.insertText = new vscode.SnippetString(snippet);
    return item;
}

function providerCompletion(): vscode.CompletionItem {
    let item = new vscode.CompletionItem("provider", vscode.CompletionItemKind.Module);
    let snippet = 'provider "${1:name}" {\n' +
        '  $0\n' +
        '}\n';
    item.insertText = new vscode.SnippetString(snippet);
    return item;
}

export const SectionCompletions: vscode.CompletionItem[] = [
    variableCompletion(),
    outputCompletion(),
    resourceCompletion(),
    dataCompletion(),
    localsCompletion(),
    moduleCompletion(),
    providerCompletion()
];