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

describe("init", function() {
    const engines = Object.assign({}, lib.ENGINES);

    afterEach(() => {
        Object.keys(lib.ENGINES).forEach(key => delete lib.ENGINES[key]);
        Object.assign(lib.ENGINES, engines);
    });

    it("should init the engines", async () => {
        const calls = [];
        useEngines(calls);
        await lib.init();
        assert.deepStrictEqual(calls.sort(), ["first:init", "second:init"]);
    });

    it("should reject the errors of the engines", async () => {
        useEngines([], new Error("Failed to init"));
        await assert.rejects(lib.init(), /Failed to init/);
    });
});

describe("destroy", function() {
    const engines = Object.assign({}, lib.ENGINES);

    afterEach(() => {
        Object.keys(lib.ENGINES).forEach(key => delete lib.ENGINES[key]);
        Object.assign(lib.ENGINES, engines);
    });

    it("should destroy the engines", async () => {
        const calls = [];
        useEngines(calls);
        await lib.destroy();
        assert.deepStrictEqual(calls.sort(), ["first:destroy", "second:destroy"]);
    });

    it("should reject the errors of the engines", async () => {
        useEngines([], new Error("Failed to destroy"));
        await assert.rejects(lib.destroy(), /Failed to destroy/);
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

describe("start", function() {
    const conf = Object.assign({}, lib.conf);
    const names = ["HOST", "PORT", "HEADLESS_KEY", "LEVEL"];

    afterEach(() => {
        names.forEach(name => delete process.env[name]);
        Object.keys(lib.conf).forEach(key => delete lib.conf[key]);
        Object.assign(lib.conf, conf);
    });

    it("should start the configuration", async () => {
        process.env.HOST = "0.0.0.0";
        process.env.PORT = "8080";
        process.env.HEADLESS_KEY = "secret";
        process.env.LEVEL = "error";
        await lib.start();
        assert.strictEqual(lib.conf.HOST, "0.0.0.0");
        assert.strictEqual(lib.conf.PORT, 8080);
        assert.strictEqual(lib.conf.KEY, "secret");
    });
});

const useEngines = (calls, error = null) => {
    const engine = name => {
        return class extends lib.Engine {
            async init() {
                await new Promise(resolve => setTimeout(resolve, 10));
                if (error) throw error;
                calls.push(`${name}:init`);
            }

            async destroy() {
                await new Promise(resolve => setTimeout(resolve, 10));
                if (error) throw error;
                calls.push(`${name}:destroy`);
            }
        };
    };
    Object.keys(lib.ENGINES).forEach(key => delete lib.ENGINES[key]);
    Object.assign(lib.ENGINES, { first: engine("first"), second: engine("second") });
};
