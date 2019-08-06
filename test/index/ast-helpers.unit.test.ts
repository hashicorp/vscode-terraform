import * as assert from 'assert';
import { findValue } from '../../src/index/ast';
import { valueToMarkdown } from '../../src/index/ast-helpers';
import { parseHcl } from '../../src/index/hcl-hil';

suite("Index Tests", () => {
  suite("Ast Helpers", () => {
    test("format string", () => {
      const [ast, error] = parseHcl('variable "region" { default = "defaultValue" }');
      let val = findValue(ast.Node.Items[0], "default");

      assert.equal(valueToMarkdown(val), "`defaultValue`");
    });

    test("ignores depth for string", () => {
      const [ast, error] = parseHcl('variable "region" { default = "defaultValue" }');
      let val = findValue(ast.Node.Items[0], "default");

      assert.equal(valueToMarkdown(val, 5), "`defaultValue`");
    });

    test("uses special value for empty list", () => {
      const [ast, error] = parseHcl('variable "region" { default = [] }');
      let val = findValue(ast.Node.Items[0], "default");

      assert.equal(valueToMarkdown(val), "*empty list*");
      assert.equal(valueToMarkdown(val, 1), "*empty list*");
    });

    test("format list of strings correctly", () => {
      const [ast, error] = parseHcl('variable "region" { default = ["a", "b"] }');
      let val = findValue(ast.Node.Items[0], "default");

      assert.equal(valueToMarkdown(val), "1. `a`\n2. `b`");
      assert.equal(valueToMarkdown(val, 1), "  1. `a`\n  2. `b`");
    });

    test("format list of numbers correctly", () => {
      const [ast, error] = parseHcl('variable "region" { default = [5, 5] }');
      let val = findValue(ast.Node.Items[0], "default");

      assert.equal(valueToMarkdown(val), "1. `5`\n2. `5`");
      assert.equal(valueToMarkdown(val, 1), "  1. `5`\n  2. `5`");
    });

    test("format list correctly in assignments", () => {
      const [ast, error] = parseHcl('region = ["5"]');
      let val = ast.Node.Items[0].Val;

      assert.equal(valueToMarkdown(val), "1. `5`");
      assert.equal(valueToMarkdown(val, 1), "  1. `5`");
    });

    test("uses special value for empty map", () => {
      const [ast, error] = parseHcl('variable "region" { default = { } }');
      let val = findValue(ast.Node.Items[0], "default");

      assert.equal(valueToMarkdown(val), "*empty map*");
      assert.equal(valueToMarkdown(val, 1), "*empty map*");
    });

    test("formats simple map correctly", () => {
      const [ast, error] = parseHcl('variable "region" { default = { a = "b" c = "d" } }');
      let val = findValue(ast.Node.Items[0], "default");

      assert.equal(valueToMarkdown(val), "- a: `b`\n- c: `d`");
      assert.equal(valueToMarkdown(val, 1), "  - a: `b`\n  - c: `d`");
    });

    test("formats map of list correctly", () => {
      const [ast, error] = parseHcl('variable "region" { default = { a = ["a", "b"] } }');
      let val = findValue(ast.Node.Items[0], "default");

      assert.equal(valueToMarkdown(val), "- a:\n  1. `a`\n  2. `b`");
      assert.equal(valueToMarkdown(val, 1), "  - a:\n    1. `a`\n    2. `b`");
    });

    test("formats map of map correctly", () => {
      const [ast, error] = parseHcl('variable "region" { default = { a = { "a" = "b" } } }');
      let val = findValue(ast.Node.Items[0], "default");

      assert.equal(valueToMarkdown(val), "- a:\n  - a: `b`");
      assert.equal(valueToMarkdown(val, 1), "  - a:\n    - a: `b`");
    });

    test("formats group correctly", () => {
      const [ast, error] = parseHcl('resource "type" "region" { group { a = "b" } }');
      let val = findValue(ast.Node.Items[0], "group");

      assert.equal(valueToMarkdown(val), "- a: `b`");
      assert.equal(valueToMarkdown(val, 1), "  - a: `b`");
    });
  });
});