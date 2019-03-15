const path = require("path");
const util = require("hive-js-util");
const puppeteer = require("puppeteer");
const fs = require("mz/fs");
const uuidv4 = require("uuid/v4");
const engine = require("./engine");

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
        this.instance && (await this.instance.close());
    }

    async render(req, res, next) {
        const url = req.query.url || "https://www.google.com/";
        const format = req.query.format || "PNG";
        const pageFormat = req.query.page_format || "A4";
        const waitUntil = req.query.wait_until || "load";
        const printBackground = req.query.print_background !== "0";
        const fullPage = req.query.full_page !== "0";
        const timeout = parseInt(req.query.timeout || 500);
        const cookie = req.query.cookie || [];
        const name = uuidv4() + "." + format;
        const tempPath = path.resolve(name);
        const isPdf = ["pdf"].indexOf(format.toLowerCase()) !== -1;
        const page = await this._newPage();
        const cookieA = Array.isArray(cookie) ? cookie : [cookie];
        const cookies = cookieA.map(v => {
            const parts = v.split(",");
            return {
                name: parts[0],
                value: parts[1],
                url: url
            };
        });
        await page.setCookie.apply(page, cookies);
        try {
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
            }
            await new Promise(function(resolve, reject) {
                res.sendFile(tempPath, {}, resolve);
            });
            await fs.unlink(tempPath);
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
