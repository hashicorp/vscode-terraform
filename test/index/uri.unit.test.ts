import * as assert from "assert";
import { Uri } from "../../src/index/uri";

suite("Uri Tests", () => {
  suite("dirname", () => {
    test("file uri", () => {
      const uri = Uri.parse("file:///a/a.tfvars");

      assert.equal(uri.dirname(), "file:///a");
    });

    test("file only", () => {
      const uri = Uri.parse("a.tf");

      assert.equal(uri.dirname(), "");
    });

    test("path with backslashes", () => {
      const uri = Uri.parse("dir\\file.tf");

      assert.equal(uri.dirname(), "dir");
    });
  });
});