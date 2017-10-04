/* jshint esversion: 7 */

const puppeteer = require("puppeteer");

var instance = null;

async function init() {
    instance = await puppeteer.launch();
}

async function destroy() {
    instance && await instance.close();
}

async function render(req, res, next) {
    const page = await instance.newPage();
    await page.goto("https://www.google.com");
    await page.screenshot({path: "example.png"});
}

module.exports = {
    init: init,
    destroy: destroy,
    render: render
};
