// The module 'assert' provides assertion methods from node
import * as assert from 'assert';
import { parseHcl } from '../../src/index/hcl-hil';
import { walk, NodeType, VisitedNode } from '../../src/index/ast';

import * as vscode from 'vscode';

suite("Index Tests", () => {
    suite("Parser Tests", () => {
        test("Can parse simple .tf", () => {
            const [ast, error] = parseHcl(`template "aws_s3_bucket" "bucket" {}`);

            assert.equal(ast.Node.Items.length, 1);

            const item = ast.Node.Items[0];

            assert.equal(item.Keys.length, 3);
        });

        test("Walk emits Item nodes", () => {
            const [a, error] = parseHcl(`template "aws_s3_bucket" "bucket" {}`);

            let found = [];
            walk(a, (type: NodeType, node: any, path: VisitedNode[], index?: number, array?: any[]) => {
                if (type === NodeType.Item) {
                    found.push(node);
                }
            });

            assert.equal(found.length, 1);
        });

        test("Walk emits Key nodes with index and array", () => {
            const [ast, error] = parseHcl(`template "aws_s3_bucket" "bucket" {}`);

            let found = [];
            walk(ast, (type: NodeType, node: any, path: VisitedNode[], index?: number, array?: any[]) => {
                if (type === NodeType.Key) {
                    found.push([index, array.length]);
                }
            });

            assert.deepEqual(found, [[0, 3], [1, 3], [2, 3]]);
        });

    });
});