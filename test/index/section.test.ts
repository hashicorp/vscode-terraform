// The module 'assert' provides assertion methods from node
import * as assert from 'assert';
import { Section } from '../../src/index/section';


const template =
    `
resource "aws_s3_bucket" "bucket" {}
variable "region" {}
data "template_file" "template" {}
locals {
    local = "local-string"
}
`;

suite("Index Tests", () => {
    suite("Section tests", () => {
        test("variable ID", () => {
            let variable = new Section("variable", null, null, "region", null, null, null);

            assert.equal(variable.id(), "var.region");
        });

        test("resource ID", () => {
            let resource = new Section("resource", "aws_s3_bucket", null, "bucket", null, null, null);

            assert.equal(resource.id(), "aws_s3_bucket.bucket");
        });

        test("data ID", () => {
            let data = new Section("data", "template_file", null, "template", null, null, null);

            assert.equal(data.id(), "data.template_file.template");
        });

        test("output ID", () => {
            let output = new Section("output", null, null, "template", null, null, null);

            assert.equal(output.id(), "template");
        });

        test("local ID", () => {
            let output = new Section("local", null, null, "my-cool-variable", null, null, null);

            assert.equal(output.id(), "local.my-cool-variable");
        });

        test("accepts new name when returning id", () => {
            let variable = new Section("variable", null, null, "region", null, null, null);

            assert.equal(variable.id("newName"), "var.newName");
        });
    });
});