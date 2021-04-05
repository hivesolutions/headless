const path = require("path");
const util = require("hive-js-util");
const puppeteer = require("puppeteer");
const jimp = require("jimp");
const fs = require("mz/fs");
const uuid = require("uuid");
const engine = require("./engine");

const puppeteerInfo = require("puppeteer/package.json");

class Puppeteer extends engine.Engine {
    constructor() {
        super();
        this.instance = null;
    }

    async init() {
        this.instance = await puppeteer.launch({
            args: ["--no-sandbox"]
        });
    }

    async destroy() {
        if (this.instance) await this.instance.close();
    }

    async version() {
        const browser = await this.instance.version();
        return `${puppeteerInfo.version} ${browser}`;
    }

    async render(req, res, next) {
        const url = req.query.url || "https://www.google.com/";
        const format = req.query.format || "PNG";
        const pageFormat = req.query.page_format || "A4";
        const waitUntil = req.query.wait_until || "load";
        const printBackground = req.query.print_background !== "0";
        const fullPage = req.query.full_page !== "0";
        const trim = req.query.trim === "1";
        const method = req.query.method || req.method;
        const body = req.body || null;
        const width = parseInt(req.query.width || 800);
        const height = parseInt(req.query.width || 600);
        const scaleFactor = parseInt(req.query.scale_factor || 1);
        const timeout = parseInt(req.query.timeout || 500);
        const cookie = req.query.cookie || [];
        const name = uuid.v4() + "." + format;
        const tempPath = path.resolve(name);
        const isPdf = ["pdf"].indexOf(format.toLowerCase()) !== -1;
        const page = await this._newPage();
        const cookieA = Array.isArray(cookie) ? cookie : [cookie];

        // computes a safe version of the body of the request where the
        // default empty payload coerces to empty string (compatible structure)
        const bodyBuffer = typeof body === "object" && Object.keys(body).length === 0 ? "" : body;

        // parses the complete set of cookies creating a sequence
        // of objects with name, value and URL
        const cookies = cookieA.map(v => {
            const parts = v.split(",");
            return {
                name: parts[0],
                value: parts[1],
                url: url
            };
        });

        // creates a request interception hook that will be able
        // to handle special method (eg: POST, PUT) to send payload
        // information to the browser request
        if (["POST", "PUT"].includes(method)) {
            // sets the flag that controls the first request to be handled
            // to false this way second and further requests will be ignored
            let isFirst = true;

            // enables request interception for the current page context,
            // otherwise it would not be possible to change the request
            await page.setRequestInterception(true);

            // registers the request interception handler that will make
            // sure that the first request is sent using the proper data
            page.on("request", request => {
                // makes sure that only the first request is intercepted
                // using a simple control flag, this ensures that no other
                // requests are re-written
                if (isFirst) {
                    isFirst = false;
                } else {
                    request.continue();
                    return;
                }

                // re-writes the request making sure that the method is the
                // one that was provided
                request.continue({
                    method: method,
                    postData: bodyBuffer || ""
                });
            });
        }

        try {
            await page.setViewport({
                width: width,
                height: height,
                deviceScaleFactor: scaleFactor
            });
            await page.setCookie.apply(page, cookies);
            await page.goto(url, {
                waitUntil: waitUntil,
                networkidle0: timeout
            });
            if (isPdf) {
                await page.pdf({
                    path: tempPath,
                    format: pageFormat,
                    printBackground: printBackground
                });
            } else {
                await page.screenshot({
                    path: tempPath,
                    fullPage: fullPage
                });
                if (trim) {
                    const image = await jimp.read(tempPath);
                    image.autocrop();
                    await image.writeAsync(tempPath);
                }
            }
            try {
                await new Promise(function(resolve, reject) {
                    res.sendFile(tempPath, {}, resolve);
                });
            } finally {
                await fs.unlink(tempPath);
            }
        } finally {
            await page.close();
        }
    }

    async _newPage() {
        let page = null;
        try {
            page = await this.instance.newPage();
        } catch (exception) {
            this.instance = await puppeteer.launch({
                args: ["--no-sandbox"]
            });
            page = await this.instance.newPage();
        }
        page.on("error", function(error) {
            util.Logging.error(error);
        });
        return page;
    }
}

module.exports = {
    Puppeteer: Puppeteer
};
