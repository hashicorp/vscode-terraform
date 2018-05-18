// The module 'assert' provides assertion methods from node
import * as assert from 'assert';
import { FileIndex } from '../../src/index/file-index';
import { Reference } from '../../src/index/reference';


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
    suite("Reference Tests", () => {
        const [index, error] = FileIndex.fromString(null, template);

        test("Handles variable references", () => {
            let r = new Reference("var.region", null, null);
            assert.equal(r.type, "variable");
            assert.equal(r.targetId, "var.region");

            let s = [...index.query(r.getQuery())];
            assert.equal(s.length, 1);
            assert.equal(s[0].name, "region");
        });

        test("Handles data references", () => {
            let r = new Reference("data.template_file.template.rendered", null, null);
            assert.equal(r.type, "data");
            assert.equal(r.targetId, "data.template_file.template");

            let s = [...index.query(r.getQuery())];
            assert.equal(s.length, 1);
            assert.equal(s[0].name, "template");
        });

        test("Handles resource references", () => {
            let r = new Reference("aws_s3_bucket.bucket.arn", null, null);
            assert.equal(r.type, "aws_s3_bucket");
            assert.equal(r.targetId, "aws_s3_bucket.bucket");

            let s = [...index.query(r.getQuery())];
            assert.equal(s.length, 1);
            assert.equal(s[0].name, "bucket");
        });

        test("Handles locals references", () => {
            let r = new Reference("local.local", null, null);
            assert.equal(r.type, "local");
            assert.equal(r.targetId, "local.local");

            let s = [...index.query(r.getQuery())];
            assert.equal(s.length, 1);
            assert.equal(s[0].name, "local");
        });

        test("Returns correct valuePath for resources", () => {
            let r = new Reference("aws_s3_bucket.bucket.arn", null, null);
            assert.deepEqual(r.valuePath(), ["arn"]);
        });

        test("Returns correct valuePath for data", () => {
            let r = new Reference("data.template_file.template.rendered", null, null);
            assert.deepEqual(r.valuePath(), ["rendered"]);
        });
    });
});