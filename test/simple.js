const assert = require("assert");
const lib = require("../lib");

describe("Array", function() {
    describe("#indexOf()", function() {
        it("should return -1 when the value is not present", () => {
            assert.strictEqual(-1, [1, 2, 3].indexOf(4));
        });
    });
    describe("#length", function() {
        it("should return proper length", () => {
            assert.strictEqual(3, [1, 2, 3].length);
        });
    });
});

describe("ENGINES", function() {
    it("should not be empty", () => {
        assert.strictEqual(true, Object.keys(lib.ENGINES).length > 0);
    });
});

describe("verifyKey", function() {
    const key = lib.conf.KEY;

    afterEach(() => {
        lib.conf.KEY = key;
    });

    it("should accept any request without key", () => {
        lib.conf.KEY = null;
        assert.doesNotThrow(() => lib.verifyKey({ query: {}, headers: {} }));
    });

    it("should accept the key of the query", () => {
        lib.conf.KEY = "secret";
        assert.doesNotThrow(() => lib.verifyKey({ query: { key: "secret" }, headers: {} }));
    });

    it("should accept the key of the header", () => {
        lib.conf.KEY = "secret";
        assert.doesNotThrow(() =>
            lib.verifyKey({ query: {}, headers: { "x-headless-key": "secret" } })
        );
    });

    it("should reject an invalid key", () => {
        lib.conf.KEY = "secret";
        assert.throws(
            () =>
                lib.verifyKey({ query: { key: "other" }, headers: { "x-headless-key": "other" } }),
            /Invalid key/
        );
    });

    it("should reject a missing key", () => {
        lib.conf.KEY = "secret";
        assert.throws(() => lib.verifyKey({ query: {}, headers: {} }), /Invalid key/);
    });
});
