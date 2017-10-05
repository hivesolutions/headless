// requires the multiple libraries
const express = require("express");
const process = require("process");
const base = require("./lib/util/base");
const config = require("./lib/util/config");

// builds the initial application object to be used
// by the application for serving
const app = express();

process.on("exit", function() {
    console.log("Exiting on user's request");
    base.destroy();
});

app.get("/", function(req, res, next) {
    async function clojure() {
        base.verifyKey(req);
        const engine = req.query.engine || "puppeteer";
        var engineModule = base.ENGINES[engine];
        await engineModule.render(req, res, next);
    }
    clojure().catch(next);
});

app.listen(config.PORT, config.HOSTNAME, function() {
    console.log("Listening on " + config.HOSTNAME + ":" + String(config.PORT));
    base.init();
});
