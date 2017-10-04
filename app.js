/* jshint esversion: 7 */

// requires the multiple libraries
const express = require("express");
const process = require("process");
const config = require("./util/config");
const phantom = require("./engines/phantom");
const puppeteer = require("./engines/puppeteer");

// builds the initial application object to be used
// by the application for serving
const app = express();

const ENGINES = {
    phantom: phantom,
    puppeteer: puppeteer
};

app.get("/", function(req, res, next) {
    async function clojure() {
        verifyKey(req);
        const engine = req.query.engine || "puppeteer";
        var engineModule = ENGINES[engine];
        await engineModule.render(req, res, next);
    }
    clojure().catch(next);
});

app.listen(config.PORT, config.HOSTNAME, function() {
    console.log("Listening on " + config.HOSTNAME + ":" + String(config.PORT));
    init();
});

process.on("exit", function() {
    console.log("Exiting on user's request");
    destroy();
});

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
