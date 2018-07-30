import * as assert from "assert";
import { match } from "../src/matcher";

suite("Matcher Tests", () => {
  test("support simple string matching", () => {
    assert(match("value", "value"));
    assert(!match("value", "another"));
  });

  test("match against a set", () => {
    assert(match("value", { type: "EXACT", match: ["value", "anothervalue"] }));
    assert(!match("value", { type: "EXACT", match: ["anothervalue"] }));
  });

  test("invert the result when comparing with string", () => {
    assert(match("value", { exclude: true, type: "EXACT", match: "anothervalue" }));
    assert(!match("value", { exclude: true, type: "EXACT", match: "value" }));
  });

  test("invert the result when comparing with array", () => {
    assert(match("value", { exclude: true, type: "EXACT", match: ["anothervalue"] }));
    assert(!match("value", { exclude: true, type: "EXACT", match: ["value"] }));
  });

  test("fuzzy match", () => {
    assert(match("anothervalue", { type: "FUZZY", match: "value" }));
    assert(!match("value", { type: "FUZZY", match: "not" }));
  });

  test("fuzzy match against a set", () => {
    assert(match("anothervalue", { type: "FUZZY", match: ["value", "not"] }));
    assert(!match("value", { type: "FUZZY", match: ["not", "yes"] }));
  });

  test("prefix match", () => {
    assert(match("anothervalue", { type: "PREFIX", match: "another" }));
    assert(!match("value", { type: "PREFIX", match: "not" }));
  });

  test("prefix match against a set", () => {
    assert(match("anothervalue", { type: "PREFIX", match: ["another", "not"] }));
    assert(!match("value", { type: "PREFIX", match: ["not", "yes"] }));
  });
});