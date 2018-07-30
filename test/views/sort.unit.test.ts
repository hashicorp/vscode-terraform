import * as assert from 'assert';
import { compareTerm } from "../../src/views/sort";

suite("View Tests", () => {
  suite("Sort Helper", () => {
    test("sorts into supplied order", () => {
      const input = ['5', '5', '4', '4', '0', '0', '1', '1'];
      const order = ['1', '5', '4', '0'];

      const actual = input.sort((a, b) => compareTerm(a, b, order));
      assert.deepEqual(actual, ['1', '1', '5', '5', '4', '4', '0', '0']);
    });

    test("sorts ANY into supplied order", () => {
      const input = ['5', '5', '4', '4', '0', '0', '1', '1'];
      const order = ['1', '*', '5'];

      const actual = input.sort((a, b) => compareTerm(a, b, order));
      assert.deepEqual(actual, ['1', '1', '4', '4', '0', '0', '5', '5']);
    });
  });
});