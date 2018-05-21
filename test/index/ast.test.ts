// The module 'assert' provides assertion methods from node
import * as assert from 'assert';
import { AstList, NodeType, VisitedNode, findValue, getMapValue, getStringValue, getText, getValue, walk } from '../../src/index/ast';
import { parseHcl } from '../../src/index/hcl-hil';


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

    suite("Ast extraction", () => {
        const [ast, error] = parseHcl('variable "region" { default = "defaultValue" }');

        test("findValue return AstVal for existing key", () => {
            let val = findValue(ast.Node.Items[0], "default");

            assert.notEqual(val, null);
        });

        test("findValue does not fail if key is missing", () => {
            let val = findValue(ast.Node.Items[0], "type");

            assert.equal(val, null);
        });

        test("getText returns the text of a token", () => {
            let list = ast.Node.Items[0].Val.List as AstList
            let text = getText(list.Items[0].Keys[0].Token);

            assert.equal(text, "default");
        });

        test("getText does not strip quotes by default", () => {
            let val = findValue(ast.Node.Items[0], "default");
            let text = getText(val.Token);

            assert.equal(text, '"defaultValue"');
        });

        test("getText can strip quotes if requested", () => {
            let val = findValue(ast.Node.Items[0], "default");
            let text = getText(val.Token, { stripQuotes: true });

            assert.equal(text, 'defaultValue');
        });

        test("getStringValue returns the string", () => {
            let val = findValue(ast.Node.Items[0], "default");
            let text = getStringValue(val, "...");

            assert.equal(text, '"defaultValue"');
        });

        test("getStringValue can strip quotes", () => {
            let val = findValue(ast.Node.Items[0], "default");
            let text = getStringValue(val, "...", { stripQuotes: true });

            assert.equal(text, 'defaultValue');
        });

        test("getStringValue returns the fallback", () => {
            let text = getStringValue(null, "fallback");

            assert.equal(text, "fallback");
        });

        test("getValue can return a Map<string, string>", () => {
            let map = getValue(ast.Node.Items[0].Val) as Map<string, string>;

            assert.equal(map.get("default"), '"defaultValue"');
        });

        test("getMapValue can return a Map<string, string>", () => {
            let map = getMapValue(ast.Node.Items[0].Val);

            assert.equal(map.get("default"), '"defaultValue"');
        });

        test("getMapValue returns empty map on string value", () => {
            let list = ast.Node.Items[0].Val.List as AstList;
            let map = getMapValue(list.Items[0].Val);

            assert.equal(map.size, 0);
        });

        test("getMapValue returns empty map on list value", () => {
            let [ast2, error2] = parseHcl(`locals { a = [] }`);

            let list = ast2.Node.Items[0].Val.List as AstList;
            let map = getMapValue(list.Items[0].Val);

            assert.equal(map.size, 0);
        });
    });
});