const fs = require("mz/fs");
const path = require("path");
const puppeteer = require("puppeteer");
const uuidv4 = require("uuid/v4");

var instance = null;

async function init() {
    instance = await puppeteer.launch({
        args: ["--no-sandbox"]
    });
}

async function destroy() {
    instance && await instance.close();
}

async function render(req, res, next) {
    const url = req.query.url || "https://www.google.com/";
    const format = req.query.format || "PNG";
    const pageFormat = req.query.page_format || "A4";
    const waitUntil = req.query.wait_until || "load";
    const fullPage = req.query.full_page !== "0";
    const timeout = parseInt(req.query.timeout || 500);
    const name = uuidv4() + "." + format;
    const tempPath = path.resolve(name);
    const isPdf = ["pdf"].indexOf(format.toLowerCase()) !== -1;
    const page = await _newPage();
    try {
        await page.goto(url, {
            waitUntil: waitUntil,
            networkIdleTimeout: timeout
        });
        if (isPdf) {
            await page.pdf({
                path: tempPath,
                format: pageFormat
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

async function _newPage() {
    var page = null;
    try {
        page = await instance.newPage();
    } catch (exception) {
        instance = await puppeteer.launch({
            args: ["--no-sandbox"]
        });
        page = await instance.newPage();
    }
    page.on("error", function(error) {
        console.log(error);
    });
    return page;
}

module.exports = {
    init: init,
    destroy: destroy,
    render: render
};
