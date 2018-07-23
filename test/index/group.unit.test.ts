import * as assert from "assert";
import { FileIndex } from "../../src/index/file-index";
import { IndexGroup } from "../../src/index/group";
import { Position } from "../../src/index/position";
import { Uri } from "../../src/index/uri";

suite("Index Tests", () => {
  suite("IndexGroup Tests", () => {
    test("create", () => {
      let group = new IndexGroup(Uri.parse("directory"));

      assert.equal(group.indices("ALL_FILES").length, 0);
    });

    test("create from index", () => {
      let [index, diagnostic] = FileIndex.fromString(Uri.parse("dir/file.tf"), "");
      let group = IndexGroup.createFromFileIndex(index);

      assert.equal(group.indices("ALL_FILES").length, 1);
      assert.equal(group.uri.toString(), "dir");
    });

    test("add index", () => {
      let [index, diagnostic] = FileIndex.fromString(Uri.parse("dir/file.tf"), 'variable "var" {}');
      let group = new IndexGroup(Uri.parse(index.uri.dirname()));

      assert.equal(group.indices("ALL_FILES").length, 0);

      group.add(index);

      assert.equal(group.indices("ALL_FILES").length, 1);
      assert(group.get(index.uri));
      assert(group.section("var.var"));
    });

    test("add index fails if wrong group", () => {
      let [index1, d1] = FileIndex.fromString(Uri.parse("dir/file1.tf"), 'variable "var1" {}');
      let group = IndexGroup.createFromFileIndex(index1);

      let [index2, d2] = FileIndex.fromString(Uri.parse("dir2/file2.tf"), 'variable "var2" {}');

      assert.throws(() => group.add(index2));

      assert.equal(group.indices("ALL_FILES").length, 1);
      assert(group.get(index1.uri));
      assert(group.section("var.var1"));
    });

    test("delete", () => {
      let [index1, d1] = FileIndex.fromString(Uri.parse("dir/file1.tf"), 'variable "var1" {}');
      let group = IndexGroup.createFromFileIndex(index1);

      let [index2, d2] = FileIndex.fromString(Uri.parse("dir/file2.tf"), 'variable "var2" {}');
      group.add(index2);

      assert.equal(group.indices("ALL_FILES").length, 2);
      assert(group.section("var.var1"));
      assert(group.section("var.var2"));

      group.delete(index1.uri);

      assert.equal(group.indices("ALL_FILES").length, 1);
      assert(!group.section("var.var1"));
      assert(group.section("var.var2"));
    });
    suite("queryReferences", () => {
      let [index1, d1] = FileIndex.fromString(Uri.parse("dir/file1.tf"), 'variable "var1" {}');
      let group = IndexGroup.createFromFileIndex(index1);

      let [index2, d2] = FileIndex.fromString(Uri.parse("dir/file2.tf"), 'resource "type" "name1" { property = "${var.var1}" }');
      group.add(index2);

      let [index3, d3] = FileIndex.fromString(Uri.parse("dir/file3.tf"), 'resource "type" "name2" { property = "${var.var1}" }');
      group.add(index3);

      test("supports ALL_FILES", () => {
        let result = group.queryReferences("ALL_FILES", { target: "var.var1" });
        assert.equal(result.length, 2);
      });

      test("supports restricting results by Uri", () => {
        let result = group.queryReferences(index3.uri, { target: "var.var1" });
        assert.equal(result.length, 1);
      });
    });
  });
});