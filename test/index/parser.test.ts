// The module 'assert' provides assertion methods from node
import * as assert from 'assert';
import * as parser from '../../src/index/parser';

import * as vscode from 'vscode';

suite("Index Tests", () => {
    suite("Parser Tests", () => {
        test("Can parse simple .tf", () => {
            const [ast, error] = parser.parseHcl(`template "aws_s3_bucket" "bucket" {}`);

            assert.equal(ast.Node.Items.length, 1);

            const item = ast.Node.Items[0];

            assert.equal(item.Keys.length, 3);
        });

        test("Walk emits Item nodes", () => {
            const [ast, error] = parser.parseHcl(`template "aws_s3_bucket" "bucket" {}`);

            let found = [];
            parser.walk(ast, (type: parser.NodeType, node: any, path: parser.VisitedNode[], index?: number, array?: any[]) => {
                if (type === parser.NodeType.Item) {
                    found.push(node);
                }
            });

            assert.equal(found.length, 1);
        });

        test("Walk emits Key nodes with index and array", () => {
            const [ast, error] = parser.parseHcl(`template "aws_s3_bucket" "bucket" {}`);

            let found = [];
            parser.walk(ast, (type: parser.NodeType, node: any, path: parser.VisitedNode[], index?: number, array?: any[]) => {
                if (type === parser.NodeType.Key) {
                    found.push([index, array.length]);
                }
            });

            assert.deepEqual(found, [[0, 3], [1, 3], [2, 3]]);
        });

    });
});