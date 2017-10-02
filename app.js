// requires the multiple libraries
const express = require("express");
const phantom = require("phantom");
const process = require("process");

// builds the initial application object to be used
// by the application for serving
var app = express();

// retrieves the complete set of configuration values
// from the current environemnt
const port = process.env.PORT ? parseInt(process.env.PORT) : 3000;
const hostname = process.env.HOST ? process.env.HOST : "127.0.0.1";

// registers for the base router  
app.get("/", function (req, res) {
    var format = req.query.format || "PNG";
    phantom.create().then(function (ph) {
        ph.createPage().then(function (page) {
            page.viewportSize = {
                width: 768,
                height: 1024
            };
            page.paperSize = {
                format: "A2"
            };
            page.open("https://stackoverflow.com/").then(function (status) {
                page.renderBase64(format).then(function (contentBase64) {
                    var content = Buffer.from(contentBase64, "base64");
                    res.type(format);
                    res.send(content);
                    page.close();
                    ph.exit();
                });
            });
        });
    });
});

app.listen(port, hostname, function () {
    console.log("Listening on " + hostname + ":" + String(port));
});
