// The module 'assert' provides assertion methods from node
import * as assert from 'assert';
import * as helpers from '../src/helpers';


suite("Helper Tests", () => {
    test("backwardsSearch returns -1 if not found", () => {
        assert.equal(helpers.backwardsSearch("haystack", () => false), -1);
    });

    test("backwardsSearch returns index", () => {
        let index = helpers.backwardsSearch("haystack", () => true);
        assert.equal(index, 7);
        assert.equal("haystack"[index], "k");
    });

});