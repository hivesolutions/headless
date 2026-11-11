const assert = require("assert");
const engine = require("../../lib/engines/engine");
const errors = require("../../lib/util/errors");

describe("Engine", function() {
    it("should return the singleton", () => {
        class Custom extends engine.Engine {}
        const instance = Custom.singleton();
        assert.ok(instance instanceof Custom);
        assert.strictEqual(Custom.singleton(), instance);
    });

    it("should return a singleton per engine", () => {
        class First extends engine.Engine {}
        class Second extends engine.Engine {}
        assert.ok(First.singleton() instanceof First);
        assert.ok(Second.singleton() instanceof Second);
        assert.notStrictEqual(First.singleton(), Second.singleton());
    });

    it("should not implement init", async () => {
        await assert.rejects(new engine.Engine().init(), errors.NotImplementedError);
    });

    it("should not implement destroy", async () => {
        await assert.rejects(new engine.Engine().destroy(), errors.NotImplementedError);
    });

    it("should not implement reload", async () => {
        await assert.rejects(new engine.Engine().reload(), errors.NotImplementedError);
    });

    it("should not implement version", async () => {
        await assert.rejects(new engine.Engine().version(), errors.NotImplementedError);
    });

    it("should not implement render", async () => {
        await assert.rejects(new engine.Engine().render({}, {}), errors.NotImplementedError);
    });
});
