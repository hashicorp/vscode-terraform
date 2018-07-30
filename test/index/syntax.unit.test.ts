import * as assert from 'assert';
import Uri from 'vscode-uri';
import { FileIndex } from "../../src/index/file-index";

suite("Index Tests", () => {
  suite("Syntax Tests", () => {
    test("terraform section", () => {
      let [file, diagnostic] = FileIndex.fromString(Uri.parse("untitled.tf"), `terraform { required_version = "=0.10.0" }`);

      assert(file, "expected parse to succeed");
      assert.equal(file.terraform.requiredVersion, "=0.10.0");
    });

    test("terraform section without required_version", () => {
      let [file, diagnostic] = FileIndex.fromString(Uri.parse("untitled.tf"), `terraform { }`);

      assert(file, "expected parse to succeed");
      assert.equal(file.terraform.requiredVersion, "");
    });

    test("terraform section with backend config", () => {
      let [file, diagnostic] = FileIndex.fromString(Uri.parse("untitled.tf"), `terraform { backend "test" {} }`);

      assert(file, "expected parse to succeed");
      assert.equal(file.terraform.requiredVersion, "");
      // no backend support today
    });
  });
});