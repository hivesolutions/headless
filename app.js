// requires the multiple libraries
const express = require("express");
const phantom = require("phantom");

// builds the initial application object to be used
// by the application for serving
const app = express();

app.get("/", function(req, res) {
    var format = req.query.format || "PNG";
    phantom.create().then(function(ph) {
        ph.createPage().then(function(page) {
            page.viewportSize = {
                width: 768,
                height: 1024
            };
            page.paperSize = {
                format: "A2"
            }
            page.open("https://stackoverflow.com/").then(function(status) {
                page.renderBase64(format).then(function(contentBase64) {
                    const content = Buffer.from(contentBase64, "base64");
                    res.type(format);
                    res.send(content);
                    page.close();
                    ph.exit();
                });
            });
        });
    });
})

app.listen(3000, function() {
    console.log("Example app listening on port 3000!");
})
