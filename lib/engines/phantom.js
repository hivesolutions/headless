// requires the multiple libraries
const fs = require("mz/fs");
const path = require("path");
const phantom = require("phantom");
const uuidv4 = require("uuid/v4");

// creates the global variable that is going to hold the
// phantom instance to be used by the rest of the application
var instance = null;

async function init() {
    instance = await phantom.create();
}

async function destroy() {
    instance && instance.exit();
}

async function render(req, res, next) {
    const url = req.query.url || "https://www.google.com/";
    const format = req.query.format || "PNG";
    const zoom = parseFloat(req.query.zoom || 1.0);
    const viewportWidth = parseInt(req.query.viewport_width || 1024);
    const viewportHeight = parseInt(req.query.viewport_height || 768);
    const pageFormat = req.query.page_format || "A2";
    const page = await instance.createPage();
    await page.open(url);
    try {
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
        } else {
            const name = uuidv4() + "." + format;
            const tempPath = path.resolve(name);
            await page.render(tempPath);
            await new Promise(function(resolve, reject) {
                res.sendFile(tempPath, {}, resolve);
            });
            await fs.unlink(tempPath);
        }
    } finally {
        await page.close();
    }
};

module.exports = {
    init: init,
    destroy: destroy,
    render: render
};
