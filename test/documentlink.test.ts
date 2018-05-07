import * as assert from 'assert';
import * as vscode from 'vscode';

suite("DocumentLink Tests", () => {
    test("Links resource sections", async () => {
        let doc = await vscode.workspace.openTextDocument({
            language: "terraform",
            content: 'resource "aws_s3_bucket" "document-link-test" {\n' +
                '  bucket = "document-link-test"\n' +
                '}'
        });

        let successful = await vscode.commands.executeCommand('terraform.index-document', doc.uri) as boolean;
        assert(successful, "forced indexing not successful");

        let links = await vscode.commands.executeCommand('vscode.executeLinkProvider', doc.uri) as vscode.DocumentLink[];
        assert.notEqual(links.length, 0, "no links returned");

        let link = links[0];
        assert.deepEqual(link.range, new vscode.Range(0, 10, 0, 23));
        assert.notEqual(link.target, null);
    });
});