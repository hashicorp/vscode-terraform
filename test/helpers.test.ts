// The module 'assert' provides assertion methods from node
import * as assert from 'assert';
import * as helpers from '../src/helpers';

import * as vscode from 'vscode';

suite("Helper Tests", () => {
    test("Correctly marks untitled terraform files as such", (done) => {
        vscode.workspace.openTextDocument({
            language: "terraform"
        }).then(doc => {
            assert.equal(true, helpers.isTerraformDocument(doc));
            done();
        });
    });
});