// The module 'assert' provides assertion methods from node
import * as assert from 'assert';
import * as ansi from '../src/ansi';

// Defines a Mocha test suite to group tests of similar kind together
suite("Ansi Tests", () => {

    // Defines a Mocha unit test
    test("Strips ansi characters from a string", () => {
        assert.equal("string without control characters", ansi.stripAnsi("\u001b[7mstring\u001b[0m without control characters"));
    });
});