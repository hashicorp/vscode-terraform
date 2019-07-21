import * as assert from "assert";
import Uri from 'vscode-uri';
import { Index } from "../../src/index";
import { FileIndex } from "../../src/index/file-index";

suite("Index Tests", () => {
  test("create", () => {
    const index = new Index();

    assert.equal(index.groups.length, 0);
  });

  test("add creates group", () => {
    let index = new Index();

    let [f1, d1] = FileIndex.fromString(Uri.file("dir1/1.tf"), 'variable "var1" {}');
    let [f2, d2] = FileIndex.fromString(Uri.file("dir2/2.tf"), 'variable "var1" {}');

    index.add(f1);
    index.add(f2);

    assert.equal(index.groups.length, 2);
  });

  test("add only creates group if it does not exist", () => {
    let index = new Index();

    let [f1, d1] = FileIndex.fromString(Uri.file("dir1/1.tf"), 'variable "var1" {}');
    let [f2, d2] = FileIndex.fromString(Uri.file("dir1/2.tf"), 'variable "var1" {}');

    index.add(f1);
    index.add(f2);

    assert.equal(index.groups.length, 1);
  });

  test("delete removes group when last index removed", () => {
    let index = new Index();

    let [f1, d1] = FileIndex.fromString(Uri.file("dir1/1.tf"), 'variable "var1" {}');
    let [f2, d2] = FileIndex.fromString(Uri.file("dir2/2.tf"), 'variable "var1" {}');

    index.add(f1);
    index.add(f2);

    assert.equal(index.groups.length, 2);

    index.delete(f2.uri);

    assert.equal(index.groups.length, 1);
    assert.equal(index.groups[0].uri.toString(), "file:///dir1");
  });
});