const config = require("./config");
const phantom = require("../engines/phantom");
const puppeteer = require("../engines/puppeteer");

const ENGINES = {
    phantom: phantom,
    puppeteer: puppeteer
};

function init() {
    initEngines();
}

function destroy() {
    destroyEngines();
}

function initEngines() {
    Object.keys(ENGINES).forEach(function(key) {
        ENGINES[key].init();
    });
}

function destroyEngines() {
    Object.keys(ENGINES).forEach(function(key) {
        ENGINES[key].destroy();
    });
}

/**
 * Verifies that the key present in the request matches
 * the one defined in the current configuration, ensuring
 * that proper security measures are in place.
 *
 * @param {any} req The request to retrieve the key.
 */
function verifyKey(req) {
    if (!config.KEY) {
        return;
    }
    const _key = req.query.key || req.headers["X-Headless-Key"] || null;
    if (config.KEY === _key) {
        return;
    }
    throw new Error("Invalid key");
}

module.exports = {
    ENGINES: ENGINES,
    init: init,
    destroy: destroy,
    verifyKey: verifyKey
};
