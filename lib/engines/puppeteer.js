/* jshint esversion: 7 */

const fs = require("fs");
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
    const waitUntil = req.query.wait_until || "networkidle";
    const fullPage = req.query.full_page !== "0";
    const timeout = parseInt(req.query.timeout || 500);
    const name = uuidv4() + "." + format;
    const tempPath = path.resolve(name);
    const isPdf = ["pdf"].indexOf(format.toLowerCase()) !== -1;
    const page = await instance.newPage();
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
        res.sendFile(tempPath, {}, function() {
            fs.unlink(tempPath, function() {});
        });
    } finally {
        page.close();
    }
}

module.exports = {
    init: init,
    destroy: destroy,
    render: render
};
