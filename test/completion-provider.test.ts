import * as assert from 'assert';
import * as vscode from 'vscode';

async function executeProvider(uri: vscode.Uri, position: vscode.Position): Promise<vscode.CompletionList> {
    let result = await vscode.commands.executeCommand('vscode.executeCompletionItemProvider', uri, position);
    return result as vscode.CompletionList;
}

function shouldHaveFunctionCompletion(list: vscode.CompletionList, label: string): vscode.CompletionItem {
    return list.items.find((i) => {
        return i.kind === vscode.CompletionItemKind.Function && i.label === label;
    });
}

function shouldHaveCompletion(list: vscode.CompletionList, id: string, kind?: vscode.CompletionItemKind): vscode.CompletionItem {
    return list.items.find((i) => {
        if (kind && i.kind !== kind)
            return false;
        return i.label === id;
    });
}

suite("Autocompletion Tests", () => {
    suite("Provider tests", () => {
        test("Autocomplete in expressions", async () => {
            let doc = await vscode.workspace.openTextDocument({
                language: 'terraform',
                content: 'output "output" {\n' +
                    '  value = "${}"\n' +
                    '}\n' +
                    'variable "variable" {}\n' +
                    'resource "resource_type" "resource" {}'
            });

            let successful = await vscode.commands.executeCommand('terraform.index-document', doc.uri) as boolean;
            assert(successful, "forced indexing not successful");

            let completions = await executeProvider(doc.uri, new vscode.Position(1, 13));
            assert.notEqual(completions.items.length, 0, "completions should not be empty");

            assert(!!shouldHaveFunctionCompletion(completions, "uuid()"), "should have uuid() completion");
            assert(!!shouldHaveCompletion(completions, "var.variable", vscode.CompletionItemKind.Variable), "should have var.variable completion");
            assert(!!shouldHaveCompletion(completions, "output", vscode.CompletionItemKind.Value), "should have output completion");
        });

        test("Autocomplete surrounded with ${} in raw strings", async () => {
            let doc = await vscode.workspace.openTextDocument({
                language: 'terraform',
                content: 'output "output" {\n' +
                    '  value = ""\n' +
                    '}\n' +
                    'variable "variable" {}\n' +
                    'resource "resource_type" "resource" {}'
            });

            let successful = await vscode.commands.executeCommand('terraform.index-document', doc.uri) as boolean;
            assert(successful, "forced indexing not successful");

            let completions = await executeProvider(doc.uri, new vscode.Position(1, 11));
            assert.notEqual(completions.items.length, 0, "completions should not be empty");

            assert.equal((shouldHaveFunctionCompletion(completions, "uuid()").insertText as vscode.SnippetString).value, "\\${uuid()\\}");

            let v = shouldHaveCompletion(completions, "var.variable", vscode.CompletionItemKind.Variable);
            assert.equal(v.insertText, "${var.variable}");

            let o = shouldHaveCompletion(completions, "output", vscode.CompletionItemKind.Value);
            assert.equal(o.insertText, "${output}");
        });

        test("Use existing string as filter", async () => {
            let doc = await vscode.workspace.openTextDocument({
                language: 'terraform',
                content: 'output "output" {\n' +
                    '  value = "${uuid()}"\n' +
                    '}\n' +
                    'variable "variable" {}\n' +
                    'resource "resource_type" "resource" {}'
            });

            let successful = await vscode.commands.executeCommand('terraform.index-document', doc.uri) as boolean;
            assert(successful, "forced indexing not successful");

            let completions = await executeProvider(doc.uri, new vscode.Position(1, 16));
            assert.notEqual(completions.items.length, 0, "completions should not be empty");

            assert(!!shouldHaveFunctionCompletion(completions, "uuid()"), "should have uuid() completion");
            assert(!shouldHaveFunctionCompletion(completions, "abs(float)"), "should not have abs(float) completion");
            assert(!shouldHaveCompletion(completions, "var.variable", vscode.CompletionItemKind.Variable), "should not have var.variable completion");
            assert(!shouldHaveCompletion(completions, "output", vscode.CompletionItemKind.Value), "should not have output completion");
        });

        test("Do not fail if completing after a .", async () => {
            let doc = await vscode.workspace.openTextDocument({
                language: 'terraform',
                content: 'output "output" {\n' +
                    '  value = "${var.}"\n' +
                    '}\n' +
                    'variable "variable" {}\n' +
                    'resource "resource_type" "resource" {}'
            });

            let successful = await vscode.commands.executeCommand('terraform.index-document', doc.uri) as boolean;
            assert(successful, "forced indexing not successful");

            let completions = await executeProvider(doc.uri, new vscode.Position(1, 17));
            assert.notEqual(completions.items.length, 0, "completions should not be empty");

            assert(!shouldHaveFunctionCompletion(completions, "uuid()"), "should not have uuid() completion");
            assert(!!shouldHaveCompletion(completions, "var.variable", vscode.CompletionItemKind.Variable), "should not have var.variable completion");
            assert(!shouldHaveCompletion(completions, "output", vscode.CompletionItemKind.Value), "should not have output completion");
        });

        test("Filter should be empty if completing after (", async () => {
            let doc = await vscode.workspace.openTextDocument({
                language: 'terraform',
                content: 'output "output" {\n' +
                    '  value = "${uuid()}"\n' +
                    '}\n' +
                    'variable "variable" {}\n' +
                    'resource "resource_type" "resource" {}'
            });

            let successful = await vscode.commands.executeCommand('terraform.index-document', doc.uri) as boolean;
            assert(successful, "forced indexing not successful");

            let completions = await executeProvider(doc.uri, new vscode.Position(1, 18));
            assert.notEqual(completions.items.length, 0, "completions should not be empty");

            assert(!!shouldHaveFunctionCompletion(completions, "uuid()"), "should have uuid() completion");
            assert(!!shouldHaveCompletion(completions, "var.variable", vscode.CompletionItemKind.Variable), "should not have var.variable completion");
            assert(!!shouldHaveCompletion(completions, "output", vscode.CompletionItemKind.Value), "should not have output completion");
        });

        test("Filter should be empty if completing after [", async () => {
            let doc = await vscode.workspace.openTextDocument({
                language: 'terraform',
                content: 'output "output" {\n' +
                    '  value = "${var.map[]}"\n' +
                    '}\n' +
                    'variable "variable" {}\n' +
                    'resource "resource_type" "resource" {}'
            });

            let successful = await vscode.commands.executeCommand('terraform.index-document', doc.uri) as boolean;
            assert(successful, "forced indexing not successful");

            let completions = await executeProvider(doc.uri, new vscode.Position(1, 21));
            assert.notEqual(completions.items.length, 0, "completions should not be empty");

            assert(!!shouldHaveFunctionCompletion(completions, "uuid()"), "should have uuid() completion");
            assert(!!shouldHaveCompletion(completions, "var.variable", vscode.CompletionItemKind.Variable), "should not have var.variable completion");
            assert(!!shouldHaveCompletion(completions, "output", vscode.CompletionItemKind.Value), "should not have output completion");
        });

        test("Filter should be empty if completing after ,", async () => {
            let doc = await vscode.workspace.openTextDocument({
                language: 'terraform',
                content: 'output "output" {\n' +
                    '  value = "${lookup(var.map, )}"\n' +
                    '}\n' +
                    'variable "variable" {}\n' +
                    'resource "resource_type" "resource" {}'
            });

            let successful = await vscode.commands.executeCommand('terraform.index-document', doc.uri) as boolean;
            assert(successful, "forced indexing not successful");

            let completions = await executeProvider(doc.uri, new vscode.Position(1, 29));
            assert.notEqual(completions.items.length, 0, "completions should not be empty");

            assert(!!shouldHaveFunctionCompletion(completions, "uuid()"), "should have uuid() completion");
            assert(!!shouldHaveCompletion(completions, "var.variable", vscode.CompletionItemKind.Variable), "should not have var.variable completion");
            assert(!!shouldHaveCompletion(completions, "output", vscode.CompletionItemKind.Value), "should not have output completion");
        });

        test("Complete terraform types", async () => {
            let doc = await vscode.workspace.openTextDocument({
                language: 'terraform',
                content: ''
            });

            let successful = await vscode.commands.executeCommand('terraform.index-document', doc.uri) as boolean;
            assert(successful, "forced indexing not successful");

            let completions = await executeProvider(doc.uri, new vscode.Position(0, 0));
            assert.notEqual(completions.items.length, 0, "completions should not be empty");

            assert(!!shouldHaveCompletion(completions, "resource", vscode.CompletionItemKind.Interface), "should have resource completion");
            assert(!!shouldHaveCompletion(completions, "data", vscode.CompletionItemKind.Interface), "should have data completion");
            assert(!!shouldHaveCompletion(completions, "variable", vscode.CompletionItemKind.Variable), "should have variable completion");
            assert(!!shouldHaveCompletion(completions, "output", vscode.CompletionItemKind.Variable), "should have output completion");
            assert(!!shouldHaveCompletion(completions, "module", vscode.CompletionItemKind.Module), "should have resource completion");
            assert(!!shouldHaveCompletion(completions, "provider", vscode.CompletionItemKind.Module), "should have provider completion");
            assert(!!shouldHaveCompletion(completions, "locals", vscode.CompletionItemKind.Class), "should have locals completion");
        });

        test("Complete resource types", async () => {
            let doc = await vscode.workspace.openTextDocument({
                language: 'terraform',
                content: 'resource ""'
            });

            let successful = await vscode.commands.executeCommand('terraform.index-document', doc.uri) as boolean;
            assert(!successful, "forced indexing unexpectedly successful");

            let completions = await executeProvider(doc.uri, new vscode.Position(0, 10));
            assert.notEqual(completions.items.length, 0, "completions should not be empty");

            assert(!!shouldHaveCompletion(completions, "aws_alb_listener", vscode.CompletionItemKind.Class), "should some aws type for completion");
            assert(!!shouldHaveCompletion(completions, "azurerm_lb", vscode.CompletionItemKind.Class), "should some azurerm data completion");
            assert(!!shouldHaveCompletion(completions, "google_project_iam_member", vscode.CompletionItemKind.Class), "should some google completion");
            assert(!!shouldHaveCompletion(completions, "oci_audit_configuration", vscode.CompletionItemKind.Class), "should have some oci completion");
            assert(!!shouldHaveCompletion(completions, "openstack_compute_keypair_v2", vscode.CompletionItemKind.Class), "should have some openstack completion");
        });

        test("Complete properties", async () => {
            let doc = await vscode.workspace.openTextDocument({
                language: 'terraform',
                content: 'variable "var" {\n' +
                    '  \n' +
                    '}'
            });

            let successful = await vscode.commands.executeCommand('terraform.index-document', doc.uri) as boolean;
            assert(successful, "forced indexing not successful");

            let completions = await executeProvider(doc.uri, new vscode.Position(1, 2));
            assert.notEqual(completions.items.length, 0, "completions should not be empty");

            let d = shouldHaveCompletion(completions, "default (variable)", vscode.CompletionItemKind.Property);
            assert(!!d, "should have default property");
            assert.notEqual(d.detail, "");
            assert(!!shouldHaveCompletion(completions, "description (variable)", vscode.CompletionItemKind.Property), "should have description property");
            assert(!!shouldHaveCompletion(completions, "type (variable)", vscode.CompletionItemKind.Property), "should type property");
        });

        test("Remove duplicate auto-completion suggestions", async () => {
            let doc = await vscode.workspace.openTextDocument({
                language: 'terraform',
                content: 'output "output" {\n' +
                    '  value = "${}"\n' +
                    '}\n' +
                    'variable "variable_do_not_show_duplicate_suggestions" {}\n' +
                    'variable "variable_do_not_show_duplicate_suggestions" {}\n' +
                    'resource "resource_type" "resource" {}'
            });

            let successful = await vscode.commands.executeCommand('terraform.index-document', doc.uri) as boolean;
            assert(successful, "forced indexing not successful");

            let completions = await executeProvider(doc.uri, new vscode.Position(1, 13));
            assert.notEqual(completions.items.length, 0, "completions should not be empty");

            let variables = completions.items.filter((i) => i.label === "var.variable_do_not_show_duplicate_suggestions");
            assert.equal(variables.length, 1);
        });

        test("Complete resource properties", async () => {
            let doc = await vscode.workspace.openTextDocument({
                language: 'terraform',
                content: 'resource "aws_s3_bucket" "name" {\n' +
                    '  \n' +
                    '}'
            });

            let successful = await vscode.commands.executeCommand('terraform.index-document', doc.uri) as boolean;
            assert(successful, "forced indexing not successful");

            let completions = await executeProvider(doc.uri, new vscode.Position(1, 2));
            assert.notEqual(completions.items.length, 0, "completions should not be empty");

            assert(!!shouldHaveCompletion(completions, "acl (aws_s3_bucket)", vscode.CompletionItemKind.Property), "should have acl property");
        });

        test("Do not fail for unknown resource properties", async () => {
            let doc = await vscode.workspace.openTextDocument({
                language: 'terraform',
                content: 'resource "unknown_resource_type" "name" {\n' +
                    '  \n' +
                    '}'
            });

            let successful = await vscode.commands.executeCommand('terraform.index-document', doc.uri) as boolean;
            assert(successful, "forced indexing not successful");

            let completions = await executeProvider(doc.uri, new vscode.Position(1, 2));
            assert.equal(completions.items.filter(i => i.kind !== vscode.CompletionItemKind.Text).length, 0, "completions should be empty");
        });
    });
});