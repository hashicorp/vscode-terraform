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

    test("backwardsSearch returns -1 if not found", () => {
        assert.equal(helpers.backwardsSearch("haystack", () => false), -1);
    });

    test("backwardsSearch returns index", () => {
        let index = helpers.backwardsSearch("haystack", () => true);
        assert.equal(index, 7);
        assert.equal("haystack"[index], "k");
    });

});