/* jshint esversion: 7 */

// requires the multiple libraries
const fs = require("fs");
const path = require("path");
const express = require("express");
const phantom = require("phantom");
const process = require("process");
const uuidv4 = require("uuid/v4");

// builds the initial application object to be used
// by the application for serving
const app = express();

// retrieves the complete set of configuration values
// from the current environment
const hostname = process.env.HOST ? process.env.HOST : "127.0.0.1";
const port = process.env.PORT ? parseInt(process.env.PORT) : 3000;
const key = process.env.HEADLESS_KEY ? process.env.HEADLESS_KEY : null;

// creates the global variable that is going to hold the
// phantom instance to be used by the rest of the application
var instance = null;

const init = async function () {
    instance = await phantom.create();
};

const destroy = async function () {
    instance && instance.exit();
};

process.on("exit", function () {
    console.log("Exiting on user's request");
    destroy();
});

app.get("/", function (req, res, next) {
    const clojure = async function (next) {
        const url = req.query.url || "https://www.google.com/";
        const format = req.query.format || "PNG";
        const zoom = parseFloat(req.query.zoom || 1.0);
        const viewportWidth = parseInt(req.query.viewport_width || 1024);
        const viewportHeight = parseInt(req.query.viewport_height || 768);
        const pageFormat = req.query.page_format || "A2";
        verifyKey(req);
        const page = await instance.createPage();
        await page.open(url);
        await page.property("zoomFactor", zoom);
        await page.property("viewportSize", {
            width: viewportWidth || null,
            height: viewportHeight || null
        });
        await page.property("paperSize", {
            format: pageFormat || null
        });
        const isBuffer = ["png", "gif", "jpeg", "jpg"].indexOf(format.toLowerCase()) !== -1;
        if (isBuffer) {
            const contentBase64 = await page.renderBase64(format);
            const content = Buffer.from(contentBase64, "base64");
            res.type(format);
            res.send(content);
            page.close();
        } else {
            const name = uuidv4() + "." + format;
            const tempPath = path.resolve(name);
            await page.render(tempPath);
            res.sendFile(tempPath, {}, function () {
                fs.unlink(tempPath, function () {});
            });
            page.close();
        }
    };

    clojure().catch(next);
});

app.listen(port, hostname, function () {
    console.log("Listening on " + hostname + ":" + String(port));
    init();
});

const verifyKey = function (req) {
    if (!key) {
        return;
    }
    const _key = req.query.key || req.headers["X-Headless-Key"] || null;
    if (key === _key) {
        return;
    }
    throw new Error("Invalid key");
};
