// The module 'assert' provides assertion methods from node
import * as assert from 'assert';

import * as vscode from 'vscode';
import { Uri } from 'vscode';
import { FileIndex, TypedSection, UntypedSection, Index, Reference } from '../../src/index/index';
import { parseHcl } from '../../src/index/hcl-hil';
import { build } from '../../src/index/build';

const template =
    `
resource "aws_s3_bucket" "bucket" {}
variable "region" {}
data "template_file" "template" {}
`;

suite("Index Tests", () => {
    suite("Reference Tests", () => {
        const [ast, error] = parseHcl(template);
        const index = build(null, ast);

        test("Handles variable references", () => {
            let r = new Reference("var.region", null);
            assert.equal(r.type, "variable");

            let s = [...index.query(r.getQuery())];
            assert.equal(s.length, 1);
            assert.equal(s[0].name, "region");
        });

        test("Handles data references", () => {
            let r = new Reference("data.template_file.file.rendered", null);
            assert.equal(r.type, "data");

            let s = [...index.query(r.getQuery())];
            assert.equal(s.length, 1);
            assert.equal(s[0].name, "template");
        });

        test("Handles resource references", () => {
            let r = new Reference("aws_s3_bucket.bucket.arn", null);
            assert.equal(r.type, "aws_s3_bucket");

            let s = [...index.query(r.getQuery())];
            assert.equal(s.length, 1);
            assert.equal(s[0].name, "bucket");
        });
    });

    suite("FileIndex Tests", () => {
        test("Returns all sections by default", () => {
            let [ast, error] = parseHcl(template);
            let index = build(null, ast);

            let all = [...index.query()];

            assert.equal(all.length, 3);
            assert.notEqual(all[0].name, all[1].name);
        });

        test("Returns only sections which match the name", () => {
            let [ast, error] = parseHcl(template);
            let index = build(null, ast);

            let r = [...index.query({ name: "uck" })];

            assert.equal(r.length, 1);
            assert.equal(r[0].name, "bucket");
        });

        test("Returns only sections which match the type", () => {
            let [ast, error] = parseHcl(template);
            let index = build(null, ast);

            let r = [...index.query({ section_type: "resource" })];

            assert.equal(r.length, 1);
            assert.equal(r[0].name, "bucket");
        });

        test("Returns only sections which match the type", () => {
            let [ast, error] = parseHcl(template);
            let index = build(null, ast);

            let r = [...index.query({ type: "aws_s3_bucket" })];

            assert.equal(r.length, 1);
            assert.equal(r[0].name, "bucket");
        });
    });

    suite("Index Tests", () => {
        let [astA, errorA] = parseHcl(`resource "aws_s3_bucket" "bucket" {}`);
        let [astB, errorB] = parseHcl(`variable "region" {}`);

        let a = build(vscode.Uri.parse("a.tf"), astA);
        let b = build(vscode.Uri.parse("b.tf"), astB);

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