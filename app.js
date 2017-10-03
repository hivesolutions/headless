/* jshint esversion: 6 */

// requires the multiple libraries
const fs = require("fs");
const path = require("path");
const express = require("express");
const phantom = require("phantom");
const process = require("process");
const uuidv4 = require("uuid/v4");

// builds the initial application object to be used
// by the application for serving
var app = express();

// retrieves the complete set of configuration values
// from the current environment
const hostname = process.env.HOST ? process.env.HOST : "127.0.0.1";
const port = process.env.PORT ? parseInt(process.env.PORT) : 3000;

var instance = null;

phantom.create().then(function (ph) {
    instance = ph;
});

process.on("exit", function () {
    instance && instance.exit();
});

app.get("/", function (req, res) {
    const url = req.query.url || "https://www.google.com/";
    const format = req.query.format || "PNG";
    const viewportWidth = parseInt(req.query.viewport_width || 1024);
    const viewportHeight = parseInt(req.query.viewport_height || 768);
    const pageFormat = req.query.page_format || "A2";
    instance.createPage().then(function (page) {
        page.open(url).then(function (status) {
            page.property("viewportSize", {
                width: viewportWidth,
                height: viewportHeight
            }).then(function () {
                page.property("paperSize", {
                    format: pageFormat
                }).then(function () {
                    const isBuffer = ["png", "gif", "jpeg", "jpg"].indexOf(format.toLowerCase()) !== -1;
                    if (isBuffer) {
                        page.renderBase64(format).then(function (contentBase64) {
                            var content = Buffer.from(contentBase64, "base64");
                            res.type(format);
                            res.send(content);
                            page.close();
                        });
                    } else {
                        const name = uuidv4() + "." + format;
                        const tempPath = path.resolve(name);
                        page.render(tempPath).then(function () {
                            res.sendFile(tempPath, {}, function () {
                                fs.unlink(tempPath, function () {
                                });
                            });
                            page.close();
                        });
                    }
                });
            });
        });
    });
});

app.listen(port, hostname, function () {
    console.log("Listening on " + hostname + ":" + String(port));
});
