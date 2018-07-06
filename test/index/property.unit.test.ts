import * as assert from 'assert';
import { Property } from '../../src/index/section';

suite("Index Tests", () => {
  suite("Property Tests", () => {
    test("toString returns string value", () => {
      const property = new Property(null, null, "value", null, null);

      assert.equal(property.toString(), "value");
    });

    test("toString returns default if value is not a string", () => {
      const property = new Property(null, null, new Array<Property>(), null, null);

      assert.equal(property.toString(), "");
      assert.equal(property.toString("default"), "default");
    });

    test("getProperty return property by name", () => {
      const child = new Property("child", null, "value", null, null);
      const parent = new Property(null, null, [child], null, null);

      assert(parent.getProperty("child"));
      assert.equal(parent.getProperty("child").toString(), "value");
    });

    test("getProperty returns child of child", () => {
      const child2 = new Property("child2", null, "child2", null, null);
      const child1 = new Property("child1", null, [child2], null, null);
      const parent = new Property(null, null, [child1], null, null);

      assert(parent.getProperty("child1"));
      assert(parent.getProperty("child1", "child2"));
      assert.equal(parent.getProperty("child1", "child2").toString(), "child2");
    });
  });
});