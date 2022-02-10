// requires the multiple libraries
const express = require("express");
const process = require("process");
const util = require("hive-js-util");
const info = require("./package");
const lib = require("./lib");

// builds the initial application object to be used
// by the application for serving
const app = express();
app.use(express.raw({ limit: "1GB", type: "*/*" }));

process.on("SIGINT", function() {
    process.exit();
});

process.on("SIGTERM", function() {
    process.exit();
});

process.on("exit", () => {
    util.Logging.info("Exiting on user's request");
    lib.destroy();
});

app.get("/", (req, res, next) => {
    async function clojure() {
        lib.verifyKey(req);
        const engine = req.query.engine || "puppeteer";
        const engineModule = lib.ENGINES[engine];
        const engineInstance = engineModule.singleton();
        await engineInstance.render(req, res, next);
    }
    clojure().catch(next);
});

app.post("/", (req, res, next) => {
    async function clojure() {
        lib.verifyKey(req);
        const engine = req.query.engine || "puppeteer";
        const engineModule = lib.ENGINES[engine];
        const engineInstance = engineModule.singleton();
        await engineInstance.render(req, res, next);
    }
    clojure().catch(next);
});

app.get("/info", (req, res, next) => {
    async function clojure() {
        res.json({
            name: info.name,
            version: info.version,
            node: process.version,
            engines: await Promise.all(
                Object.entries(lib.ENGINES).map(async ([name, module]) => {
                    return [name, await module.singleton().version()];
                })
            )
        });
    }
    clojure().catch(next);
});

app.all("*", (req, res, next) => {
    res.status(404);
    res.json({ error: "Route not found", code: 404 });
});

app.use((err, req, res, next) => {
    if (res.headersSent) {
        return next(err);
    }
    const code = err.code || 500;
    const result = { error: err.message, code: code };
    if (process.env.NODE_ENV !== "production") {
        result.stack = err.stack ? err.stack.split("\n") : [];
    }
    res.status(code);
    res.json(result);
});

(async () => {
    await lib.start();
    try {
        app.listen(lib.conf.PORT, lib.conf.HOST, () => {
            try {
                util.Logging.info("Listening on " + lib.conf.HOST + ":" + String(lib.conf.PORT));
                lib.init();
            } catch (err) {
                util.Logging.error(err);
            }
        });
    } finally {
        await lib.stop();
    }
})();
