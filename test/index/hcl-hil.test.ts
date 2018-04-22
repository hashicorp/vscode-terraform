// The module 'assert' provides assertion methods from node
import * as assert from 'assert';
import { parseHcl } from '../../src/index/hcl-hil';

import * as vscode from 'vscode';

suite("HclHil Tests", () => {
    test("Can parse .tf", () => {
        const ast = parseHcl(`template "aws_s3_bucket" "bucket" {}`);

        assert.equal(ast.Node.Items.length, 1);

        const item = ast.Node.Items[0];

        assert.equal(item.Keys.length, 3);
    });

    test("Throws ParseError if invalid", () => {
        assert.throws(() => parseHcl(`template "aws_s3_bucket" "bucket"`));
    });
});