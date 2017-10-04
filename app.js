/* jshint esversion: 7 */

// requires the multiple libraries
const express = require("express");
const process = require("process");
const phantom = require("./engines/phantom");

// builds the initial application object to be used
// by the application for serving
const app = express();

// retrieves the complete set of configuration values
// from the current environment
const hostname = process.env.HOST ? process.env.HOST : "127.0.0.1";
const port = process.env.PORT ? parseInt(process.env.PORT) : 3000;
const key = process.env.HEADLESS_KEY ? process.env.HEADLESS_KEY : null;

app.get("/", function(req, res, next) {
    async function clojure() {
        verifyKey(req);
        phantom.render(req, res, next);
    }
    clojure().catch(next);
});

app.listen(port, hostname, function() {
    console.log("Listening on " + hostname + ":" + String(port));
    phantom.init();
});

process.on("exit", function() {
    console.log("Exiting on user's request");
    phantom.destroy();
});

function verifyKey(req) {
    if (!key) {
        return;
    }
    const _key = req.query.key || req.headers["X-Headless-Key"] || null;
    if (key === _key) {
        return;
    }
    throw new Error("Invalid key");
}
