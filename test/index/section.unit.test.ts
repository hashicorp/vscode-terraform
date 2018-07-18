// The module 'assert' provides assertion methods from node
import * as assert from 'assert';
import { FileIndex } from '../../src/index/file-index';
import { Position } from '../../src/index/position';
import { Section } from '../../src/index/section';
import { Uri } from '../../src/index/uri';

suite("Index Tests", () => {
    suite("Section tests", () => {
        test("variable ID", () => {
            let variable = new Section("variable", null, null, "region", null, null, null, null);

            assert.equal(variable.id(), "var.region");
        });

        test("resource ID", () => {
            let resource = new Section("resource", "aws_s3_bucket", null, "bucket", null, null, null, null);

            assert.equal(resource.id(), "aws_s3_bucket.bucket");
        });

        test("data ID", () => {
            let data = new Section("data", "template_file", null, "template", null, null, null, null);

            assert.equal(data.id(), "data.template_file.template");
        });

        test("output ID", () => {
            let output = new Section("output", null, null, "template", null, null, null, null);

            assert.equal(output.id(), "template");
        });

        test("local ID", () => {
            let output = new Section("local", null, null, "my-cool-variable", null, null, null, null);

            assert.equal(output.id(), "local.my-cool-variable");
        });

        test("accepts new name when returning id", () => {
            let variable = new Section("variable", null, null, "region", null, null, null, null);

            assert.equal(variable.id("newName"), "var.newName");
        });

        test("Extracts all top level attributes", () => {
            let template = `
resource "aws_s3_bucket" "bucket" {
    bucket = "name"

    logging {
        enabled = true // should not be indexed
    }
}

provider "aws" {
    version = "~> 1.0"
}
`;

            let [fileIndex, diagnostic] = FileIndex.fromString(Uri.parse("a.tf"), template);

            let resource = fileIndex.sections[0];
            assert.equal(resource.properties.length, 2);
            assert.equal(resource.getStringProperty("bucket"), "name");

            let provider = fileIndex.sections[1];
            assert.equal(provider.properties.length, 1);
            assert.equal(provider.getStringProperty("version"), "~> 1.0");
        });

        test("Extract no attributes for local sections (they are virtual)", () => {
            let template = `
locals {
    a = 5
}
`;

            let [fileIndex, diagnostic] = FileIndex.fromString(Uri.parse("a.tf"), template);

            let localA = fileIndex.sections[0];
            assert.equal(localA.properties.length, 0);
        });

        suite("match", () => {
            const [index, diagnostic] = FileIndex.fromString(Uri.parse('section.match.test.tf'), `resource "resource_type" "resource_name" {}`);
            assert(index);

            const section = index.sections[0];
            assert(section);

            test("by id", () => {
                assert(section.match({ id: "resource_type.resource_name" }));
                assert(!section.match({ id: "resource_type.resource" }));
            });

            test("by section type", () => {
                assert(section.match({ section_type: "resource" }));
                assert(!section.match({ section_type: "data" }));
                assert(!section.match({ section_type: "reso" }));
            });

            test("by type", () => {
                assert(section.match({ type: "resource_type" }));
                assert(section.match({ type: "resource" }));
                assert(!section.match({ type: "name" }));
            });

            test("by name", () => {
                assert(section.match({ name: "resource_name" }));
                assert(section.match({ name: "resource" }));
                assert(!section.match({ name: "type" }));
            });

            test("by name position", () => {
                assert(section.match({ name_position: new Position(0, 32) }));
                assert(!section.match({ name_position: new Position(0, 5) }));
            });

            test("by position", () => {
                assert(section.match({ position: new Position(0, 1) }), "expected section at pos 0, 1");
                assert(section.match({ position: new Position(0, 5) }), "expected section at pos 0, 5");
                assert(section.match({ position: new Position(0, 42) }), "expected section at pos 0, 42");
                assert(!section.match({ position: new Position(1, 0) }), "did not expect section at pos 1, 0");
            });
        });
    });
});