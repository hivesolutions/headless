/* jshint esversion: 6 */

// requires the multiple libraries
const express = require("express");
const phantom = require("phantom");
const process = require("process");

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
    var url = req.query.url || "https://www.google.com/";
    var format = req.query.format || "PNG";
    var viewportWidth = req.query.viewport_width || 768;
    var viewportHeight = req.query.viewport_height || 1024;
    var pageFormat = req.query.page_format || "A2";
    viewportWidth = parseInt(viewportWidth);
    viewportHeight = parseInt(viewportHeight);
    instance.createPage().then(function (page) {
        page.viewportSize = {
            width: viewportWidth,
            height: viewportHeight
        };
        page.paperSize = {
            format: pageFormat
        };
        page.open(url).then(function (status) {
            page.renderBase64(format).then(function (contentBase64) {
                var content = Buffer.from(contentBase64, "base64");
                res.type(format);
                res.send(content);
                page.close();
            });
        });
    });
});

app.listen(port, hostname, function () {
    console.log("Listening on " + hostname + ":" + String(port));
});
