// The module 'assert' provides assertion methods from node
import * as assert from 'assert';
import { FileIndex } from '../../src/index/file-index';


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
    suite("FileIndex Tests", () => {
        test("Returns all sections by default", () => {
            let [index, error] = FileIndex.fromString(null, template);

            let all = [...index.query()];

            assert.equal(all.length, 4);
            let allIds = all.map((s) => s.id());
            let uniqueIds = [...new Set<string>(allIds)];
            assert.deepEqual(allIds, uniqueIds);
        });

        test("Returns only sections which match the name", () => {
            let [index, error] = FileIndex.fromString(null, template);

            let r = [...index.query({ name: "uck" })];

            assert.equal(r.length, 1);
            assert.equal(r[0].name, "bucket");
        });

        test("Returns only sections which match the type", () => {
            let [index, error] = FileIndex.fromString(null, template);

            let r = [...index.query({ section_type: "resource" })];

            assert.equal(r.length, 1);
            assert.equal(r[0].name, "bucket");
        });

        test("Returns only sections which match the type", () => {
            let [index, error] = FileIndex.fromString(null, template);

            let r = [...index.query({ type: "aws_s3_bucket" })];

            assert.equal(r.length, 1);
            assert.equal(r[0].name, "bucket");
        });

        test("Returns only sections which match the id", () => {
            let [index, error] = FileIndex.fromString(null, template);

            let r = [...index.query({ id: "aws_s3_bucket.bucket" })];

            assert.equal(r.length, 1);
            assert.equal(r[0].name, "bucket");
        });
    });
});