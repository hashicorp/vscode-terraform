// The module 'assert' provides assertion methods from node
import * as assert from 'assert';
import * as vscode from 'vscode';
import { FileIndex } from '../../src/index/file-index';

suite("Index Tests", () => {
    suite("Build Tests", () => {
        const uri = vscode.Uri.parse("untitled:file");

        test("Collects typed sections", () => {
            let [index, error] = FileIndex.fromString(uri, `resource "aws_s3_bucket" "bucket" {}`);

            assert.equal(index.sections.length, 1);

            let s = index.sections[0];
            assert.equal(s.sectionType, "resource");

            let typeLocation = new vscode.Location(uri, new vscode.Range(0, 10, 0, 23));
            assert.equal(s.type, "aws_s3_bucket");
            assert.deepEqual(s.typeLocation, typeLocation, "type location");

            let nameLocation = new vscode.Location(uri, new vscode.Range(0, 26, 0, 32));
            assert.equal(s.name, "bucket");
            assert.deepEqual(s.nameLocation, nameLocation, "name location");

            let location = new vscode.Location(uri, new vscode.Range(0, 0, 0, 35));
            assert.deepEqual(s.location, location, "section location");
        });

        test("Collects untyped sections", () => {
            let [index, error] = FileIndex.fromString(uri, `variable "region" {}`);

            assert.equal(index.sections.length, 1);
            assert.equal(index.sections[0].sectionType, "variable");

            let nameLocation = new vscode.Location(uri, new vscode.Range(0, 10, 0, 16));
            assert.equal(index.sections[0].name, "region");
            assert.deepEqual(index.sections[0].nameLocation, nameLocation, "name location");
        });

        test("Collects string references", () => {
            let [index, error] = FileIndex.fromString(uri, 'resource "aws_s3_bucket" "bucket" { bucket_name = "${var.region}" }');

            assert.equal(index.sections.length, 1);

            let s = index.sections[0];
            assert.equal(s.sectionType, "resource");

            assert.equal(s.references.length, 1);

            let r = s.references[0];
            assert.equal(r.type, "variable");
            assert.equal(r.parts[0], "region");
            assert.equal(r.location.range.start.line, 0);
            assert.equal(r.location.range.start.character, 53);
            assert.equal(r.location.range.end.line, 0);
            assert.equal(r.location.range.end.character, 63);
        });

        test("Collects map references", () => {
            let [index, error] = FileIndex.fromString(uri, 'resource "aws_s3_bucket" "bucket" { bucket_name = "${var.region["key"]}" }');

            assert.equal(index.sections.length, 1);

            let s = index.sections[0];
            assert.equal(s.sectionType, "resource");

            assert.equal(s.references.length, 1);

            let r = s.references[0];
            assert.equal(r.type, "variable");
            assert.equal(r.parts[0], "region");
            assert.equal(r.location.range.start.line, 0);
            assert.equal(r.location.range.start.character, 53);
            assert.equal(r.location.range.end.line, 0);
            assert.equal(r.location.range.end.character, 63);
        });

        test("Collects list references", () => {
            let [index, error] = FileIndex.fromString(uri, 'resource "aws_s3_bucket" "bucket" { bucket_name = "${var.region[0]}" }');

            assert.equal(index.sections.length, 1);

            let s = index.sections[0];
            assert.equal(s.sectionType, "resource");

            assert.equal(s.references.length, 1);

            let r = s.references[0];
            assert.equal(r.type, "variable");
            assert.equal(r.parts[0], "region");
            assert.equal(r.location.range.start.line, 0);
            assert.equal(r.location.range.start.character, 53);
            assert.equal(r.location.range.end.line, 0);
            assert.equal(r.location.range.end.character, 63);
        });

        test("Collects nested references", () => {
            let [index, error] = FileIndex.fromString(uri, 'resource "aws_s3_bucket" "bucket" { bucket_name = "${var.region[lookup(var.map, "key")]}" }');

            assert.equal(index.sections.length, 1);

            let s = index.sections[0];
            assert.equal(s.sectionType, "resource");

            assert.equal(s.references.length, 2);

            let r = s.references[1];
            assert.equal(r.type, "variable");
            assert.equal(r.parts[0], "region");
            assert.equal(r.location.range.start.line, 0);
            assert.equal(r.location.range.start.character, 53);
            assert.equal(r.location.range.end.line, 0);
            assert.equal(r.location.range.end.character, 63);

            let m = s.references[0];
            assert.equal(m.type, "variable");
            assert.equal(m.parts[0], "map");
            assert.equal(m.location.range.start.line, 0);
            assert.equal(m.location.range.start.character, 71);
            assert.equal(m.location.range.end.line, 0);
            assert.equal(m.location.range.end.character, 78);
        });

        test("Ignores self.* and count.* references", () => {
            let [index, error] = FileIndex.fromString(uri, 'resource "aws_s3_bucket" "bucket" { bucket_name = "${self.value}" cool_dude = "${count.index}" }');

            assert.equal(index.sections.length, 1);

            let s = index.sections[0];
            assert.equal(s.sectionType, "resource");

            assert.equal(s.references.length, 0);
        });

        test("Associates references for the correct section", () => {
            let [index, error] = FileIndex.fromString(uri, 'resource "aws_s3_bucket" "bucket" { bucket_name = "${var.region}" } variable "region" {}');

            assert.equal(index.sections.length, 2);

            let resource = index.sections[0];
            assert.equal(resource.sectionType, "resource");
            assert.equal(resource.references.length, 1);

            let variable = index.sections[1];
            assert.equal(variable.sectionType, "variable");
            assert.equal(variable.references.length, 0);
        });

        test("Handles locals", () => {
            let [index, error] = FileIndex.fromString(uri, 'variable "local-test" {}\nlocals {\n  local1 = "${var.local-test}"\n  local2 = [ "${var.local-test}" ]\n}\n');

            assert.equal(index.sections.length, 3);

            let resource = index.sections[0];
            assert.equal(resource.sectionType, "variable");

            let local1 = index.sections[1];
            assert.equal(local1.id(), "local.local1");
            assert.equal(local1.references.length, 1);
            assert.equal(local1.references[0].targetId, "var.local-test");

            let local2 = index.sections[2];
            assert.equal(local2.id(), "local.local2");
            assert.equal(local2.references.length, 1);
            assert.equal(local2.references[0].targetId, "var.local-test");
        });

        test("Collects HIL parse errors", () => {
            let [index, error] = FileIndex.fromString(uri, 'locals {\n  local1 = "${lookup(}"\n}');

            assert(index, "index should not be null");
            assert(!error, "there should not be an error");

            assert.equal(index.diagnostics.length, 1);

            let d = index.diagnostics[0];
            assert.equal(d.message, 'expected expression but found "}"');
            assert.equal(d.range.start.line, 1);
            assert.equal(d.range.start.character, 11);
            assert.equal(d.range.end.line, 1);
            assert.equal(d.range.end.character, 23);
        });
    });

    suite("handles .tfvars syntax", () => {
        const uri = vscode.Uri.parse("untitled:file");

        test("Handle map", () => {
            let [index, error] = FileIndex.fromString(uri, 'amis = { A = "B" }');

            assert.equal(index.sections.length, 0);
            assert.equal(index.assignments.length, 1);

            assert.equal(index.assignments[0].targetId, "var.amis");
        });

        test("Handle list", () => {
            let [index, error] = FileIndex.fromString(uri, 'amis = [ "list" ]');

            assert.equal(index.sections.length, 0);
            assert.equal(index.assignments.length, 1);

            assert.equal(index.assignments[0].targetId, "var.amis");
        });

        test("Handle string", () => {
            let [index, error] = FileIndex.fromString(uri, 'amis = "list"');

            assert.equal(index.sections.length, 0);
            assert.equal(index.assignments.length, 1);

            assert.equal(index.assignments[0].targetId, "var.amis");
        });
    });
});