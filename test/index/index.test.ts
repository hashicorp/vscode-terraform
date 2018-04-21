// The module 'assert' provides assertion methods from node
import * as assert from 'assert';

import * as vscode from 'vscode';
import { Uri } from 'vscode';
import { FileIndex, TypedSection, UntypedSection, Index } from '../../src/index/index';
import { parseHcl } from '../../src/index/hcl-hil';
import { build } from '../../src/index/build';

const template =
    `
resource "aws_s3_bucket" "bucket" {}
variable "region" {}
`;

suite("Index Tests", () => {
    suite("FileIndex Tests", () => {
        test("Returns all sections by default", () => {
            let index = build(null, parseHcl(template));

            let all = [...index.sections()];

            assert.equal(all.length, 2);
            assert.notEqual(all[0].name, all[1].name);
        });

        test("Returns only sections which match the name", () => {
            let index = build(null, parseHcl(template));

            let r = [...index.sections({ name: "uck" })];

            assert.equal(r.length, 1);
            assert.equal(r[0].name, "bucket");
        });

        test("Returns only sections which match the type", () => {
            let index = build(null, parseHcl(template));

            let r = [...index.sections({ section_type: "resource" })];

            assert.equal(r.length, 1);
            assert.equal(r[0].name, "bucket");
        });

        test("Returns only sections which match the type", () => {
            let index = build(null, parseHcl(template));

            let r = [...index.sections({ type: "aws_s3_bucket" })];

            assert.equal(r.length, 1);
            assert.equal(r[0].name, "bucket");
        });
    });

    suite("Index Tests", () => {
        let a = build(vscode.Uri.parse("a.tf"), parseHcl(`resource "aws_s3_bucket" "bucket" {}`));
        let b = build(vscode.Uri.parse("b.tf"), parseHcl(`variable "region" {}`));

        test("query can return results for ALL files", () => {
            let index = new Index(a, b);

            let results = index.query("ALL_FILES");

            assert.equal(results.length, 2);
        });

        test("query returns results for a single file", () => {
            let index = new Index(a, b);

            let results = index.query(vscode.Uri.parse("a.tf"));

            assert.equal(results.length, 1);
            assert.equal(results[0].name, "bucket");
        });
    });
});