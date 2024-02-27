const fs = require("mz/fs");
const path = require("path");
const uuid = require("uuid");
const engine = require("./engine");

let phantom = {};
let phantomInfo = {};

try {
    phantom = require("phantom");
    phantomInfo = require("phantom/package.json");
} catch (e) {
    console.warn("PhantomJS is not installed, the Phantom engine will not be available");
}

const VALID_FORMATS = ["png", "gif", "jpeg", "jpg"];

class Phantom extends engine.Engine {
    async init() {
        this.instance = await phantom?.create?.();
    }

    async destroy() {
        if (this.instance) this.instance.exit();
    }

    async version() {
        return phantomInfo.version;
    }

    async render(req, res, next) {
        const url = req.query.url || "https://www.google.com/";
        const format = req.query.format || "PNG";
        const zoom = parseFloat(req.query.zoom || 1.0);
        const viewportWidth = parseInt(req.query.viewport_width || 1024);
        const viewportHeight = parseInt(req.query.viewport_height || 768);
        const pageFormat = req.query.page_format || "A2";
        const page = await this.instance.createPage();
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
            const isBuffer = VALID_FORMATS.indexOf(format.toLowerCase()) !== -1;
            if (isBuffer) {
                const contentBase64 = await page.renderBase64(format);
                const content = Buffer.from(contentBase64, "base64");
                res.type(format);
                res.send(content);
            } else {
                const name = uuid.v4() + "." + format;
                const tempPath = path.resolve(name);
                await page.render(tempPath);
                try {
                    await new Promise(function(resolve, reject) {
                        res.sendFile(tempPath, {}, err => (err ? reject(err) : resolve()));
                    });
                } finally {
                    await fs.unlink(tempPath);
                }
            }
        } finally {
            await page.close();
        }
    }
}

module.exports = {
    Phantom: Phantom
};
