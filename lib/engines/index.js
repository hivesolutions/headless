const engine = require("./engine");
const phantom = require("./phantom");
const puppeteer = require("./puppeteer");

Object.assign(module.exports, engine);
Object.assign(module.exports, phantom);
Object.assign(module.exports, puppeteer);
