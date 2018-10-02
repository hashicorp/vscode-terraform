// The module 'assert' provides assertion methods from node
import * as assert from 'assert';
import Uri from 'vscode-uri';
import { DiagnosticSeverity } from '../../src/index/diagnostic';
import { FileIndex } from '../../src/index/file-index';
import { Location } from '../../src/index/location';
import { Position } from '../../src/index/position';
import { Property } from '../../src/index/property';
import { Range } from '../../src/index/range';

suite("Index Tests", () => {
    suite("Build Tests", () => {
        const uri = Uri.parse("untitled:file");

        test("Collects typed sections", () => {
            let [index, error] = FileIndex.fromString(uri, `resource "aws_s3_bucket" "bucket" {}`);

            assert.equal(index.sections.length, 1);

            let s = index.sections[0];
            assert.equal(s.sectionType, "resource");

            let typeLocation = new Location(uri, new Range(new Position(0, 10), new Position(0, 23)));
            assert.equal(s.type, "aws_s3_bucket");
            assert.deepEqual(s.typeLocation, typeLocation, "type location");

            let nameLocation = new Location(uri, new Range(new Position(0, 26), new Position(0, 32)));
            assert.equal(s.name, "bucket");
            assert.deepEqual(s.nameLocation, nameLocation, "name location");

            let location = new Location(uri, new Range(new Position(0, 0), new Position(0, 36)));
            assert.deepEqual(s.location, location, "section location");
        });

        test("Collects untyped sections", () => {
            let [index, error] = FileIndex.fromString(uri, `variable "region" {}`);

            assert.equal(index.sections.length, 1);
            assert.equal(index.sections[0].sectionType, "variable");

            let nameLocation = new Location(uri, new Range(new Position(0, 10), new Position(0, 16)));
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

        test("Collects references in math expressions", () => {
            let [index, error] = FileIndex.fromString(uri, 'resource "aws_s3_bucket" "bucket" { bucket_name = "${var.var1 * var.var2 * 5 * var.var3}" }');

            assert.equal(index.sections.length, 1);

            let s = index.sections[0];
            assert.equal(s.sectionType, "resource");

            assert.equal(s.references.length, 3);

            let v1 = s.references.find((r) => r.parts[0] === "var1");
            assert(v1, "var1 not found");
            assert.equal(v1.type, "variable");
            assert.equal(v1.location.range.start.line, 0);
            assert.equal(v1.location.range.start.character, 53);
            assert.equal(v1.location.range.end.line, 0);
            assert.equal(v1.location.range.end.character, 61);

            let v2 = s.references.find((r) => r.parts[0] === "var2");
            assert(v2, "var2 not found");
            assert.equal(v2.type, "variable");
            assert.equal(v2.location.range.start.line, 0);
            assert.equal(v2.location.range.start.character, 64);
            assert.equal(v2.location.range.end.line, 0);
            assert.equal(v2.location.range.end.character, 72);

            let v3 = s.references.find((r) => r.parts[0] === "var3");
            assert(v3, "var3 not found");
            assert.equal(v3.type, "variable");
            assert.equal(v3.location.range.start.line, 0);
            assert.equal(v3.location.range.start.character, 79);
            assert.equal(v3.location.range.end.line, 0);
            assert.equal(v3.location.range.end.character, 87);
        });

        suite("Collects properties", () => {
            test("No properties for empty sections", () => {
                let [index, error] = FileIndex.fromString(uri, `resource "aws_s3_bucket" "bucket" {}`);

                let s = index.sections[0];
                assert.equal(s.properties.length, 0);
            });

            test("String properties", () => {
                let [index, error] = FileIndex.fromString(uri, `resource "aws_s3_bucket" "bucket" { property = "string" }`);

                let s = index.sections[0];
                assert.equal(s.properties.length, 1);

                const p = s.properties[0];
                assert.equal(p.name, "property");
                assert.equal(p.nameLocation.range.start.line, 0);
                assert.equal(p.nameLocation.range.start.character, 36);
                assert.equal(p.nameLocation.range.end.line, 0);
                assert.equal(p.nameLocation.range.end.character, 44);

                assert.equal(p.value, "string");
                assert.equal(p.valueLocation.range.start.line, 0);
                assert.equal(p.valueLocation.range.start.character, 47);
                assert.equal(p.valueLocation.range.end.line, 0);
                assert.equal(p.valueLocation.range.end.character, 55);
            });

            test("List properties", () => {
                let [index, error] = FileIndex.fromString(uri, `resource "aws_s3_bucket" "bucket" { property = ["list"] }`);

                let s = index.sections[0];
                assert.equal(s.properties.length, 1);

                const p = s.properties[0];
                assert.equal(p.name, "property");
                assert.equal(p.nameLocation.range.start.line, 0);
                assert.equal(p.nameLocation.range.start.character, 36);
                assert.equal(p.nameLocation.range.end.line, 0);
                assert.equal(p.nameLocation.range.end.character, 44);

                assert.equal(p.value, "");
                assert.equal(p.valueLocation.range.start.line, 0);
                assert.equal(p.valueLocation.range.start.character, 47);
                assert.equal(p.valueLocation.range.end.line, 0);
                assert.equal(p.valueLocation.range.end.character, 55);
            });

            test("Groups properties", () => {
                let [index, error] = FileIndex.fromString(uri, `resource "aws_s3_bucket" "bucket" { group { property = "string" } }`);

                let s = index.sections[0];
                assert.equal(s.properties.length, 1);

                const p = s.properties[0];
                assert.equal(p.name, "group");
                assert.equal(p.nameLocation.range.start.line, 0);
                assert.equal(p.nameLocation.range.start.character, 36);
                assert.equal(p.nameLocation.range.end.line, 0);
                assert.equal(p.nameLocation.range.end.character, 41);

                assert.notEqual(typeof p.value, "string");
                assert.equal(p.valueLocation.range.start.line, 0);
                assert.equal(p.valueLocation.range.start.character, 42);
                assert.equal(p.valueLocation.range.end.line, 0);
                assert.equal(p.valueLocation.range.end.character, 65);

                const sp = (p.value as Property[])[0];
                assert.equal(sp.name, "property");
                assert.equal(sp.nameLocation.range.start.line, 0);
                assert.equal(sp.nameLocation.range.start.character, 44);
                assert.equal(sp.nameLocation.range.end.line, 0);
                assert.equal(sp.nameLocation.range.end.character, 52);

                assert.equal(sp.value, "string");
                assert.equal(sp.valueLocation.range.start.line, 0);
                assert.equal(sp.valueLocation.range.start.character, 55);
                assert.equal(sp.valueLocation.range.end.line, 0);
                assert.equal(sp.valueLocation.range.end.character, 63);
            });

            test("Computes correct end pos of heredoc properties", () => {
                let [index, error] = FileIndex.fromString(uri, `resource "aws_s3_bucket" "bucket" {\n  property = <<EOF\nstring\nEOF\n}`);

                let s = index.sections[0];
                assert.equal(s.properties.length, 1);

                const p = s.properties[0];
                assert.equal(p.value, "<<EOF\nstring\nEOF\n");
                assert.equal(p.valueLocation.range.start.line, 1, "start line");
                assert.equal(p.valueLocation.range.start.character, 13, "start character");
                assert.equal(p.valueLocation.range.end.line, 3, "end line");
                assert.equal(p.valueLocation.range.end.character, 3, "end character");
            });
        });

        suite("handles .tfvars syntax", () => {
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

        suite("Collects terraform sections", () => {
            test("correctly collects and parses requirement", () => {
                let [index, error] = FileIndex.fromString(uri, `terraform { required_version = ">1.0" }`);

                assert(index.terraform);
                assert(index.terraform.requirement);
                assert.equal(index.terraform.requiredVersion, ">1.0");
                assert.equal(index.terraform.requirement.constraints.length, 1);
            });

            /*
            temporarily disabled in 1.3.6

            test("emits warning if terraform section is missing required_version attribute", () => {
                let [index, error] = FileIndex.fromString(uri, `terraform {}`);

                assert(index.terraform);
                assert(!index.terraform.requirement);
                assert.equal(index.terraform.requiredVersion, "");

                assert.equal(index.diagnostics.length, 1);
                assert.equal(index.diagnostics[0].severity, DiagnosticSeverity.WARNING);
                assert.equal(index.diagnostics[0].range.start.line, 0);
                assert.equal(index.diagnostics[0].range.start.character, 0);
                assert.equal(index.diagnostics[0].range.end.line, 0);
                assert.equal(index.diagnostics[0].range.end.character, 12);
            });
            */

            test("does not fail if required_version is cannot be parsed", () => {
                let [index, error] = FileIndex.fromString(uri, `terraform { required_version = "yolo" }`);

                assert(index.terraform);
                assert(!index.terraform.requirement);
                assert.equal(index.terraform.requiredVersion, "yolo");
                assert.equal(index.diagnostics.length, 1);
                assert.equal(index.diagnostics[0].severity, DiagnosticSeverity.ERROR);
                assert.equal(index.diagnostics[0].range.start.line, 0);
                assert.equal(index.diagnostics[0].range.start.character, 31);
                assert.equal(index.diagnostics[0].range.end.line, 0);
                assert.equal(index.diagnostics[0].range.end.character, 37);
            });
        });
    });
});