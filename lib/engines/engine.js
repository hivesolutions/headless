const errors = require("../util/errors");

class Engine {
    async init() {
        throw errors.NotImplementedError();
    }

    async destroy() {
        throw errors.NotImplementedError();
    }
}
