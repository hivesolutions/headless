var assert = require("assert");
var lib = require("../lib");

describe("Array", function() {
    describe("#indexOf()", function() {
        it("should return -1 when the value is not present", () => {
            assert.equal(-1, [1, 2, 3].indexOf(4));
        });
    });
    describe("#length", function() {
        it("should return proper length", () => {
            assert.equal(3, [1, 2, 3].length);
        });
    });
});

describe("ENGINES", function() {
    it("should not be empty", () => {
        assert.equal(true, Object.keys(lib.ENGINES).length > 0);
    });
});
