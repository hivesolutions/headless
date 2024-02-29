const util = require("hive-js-util");
const puppeteer = require("puppeteer");
const jimp = require("jimp");
const engine = require("./engine");

const puppeteerInfo = require("puppeteer/package.json");

/**
 * The extra headers for which propagation is expected
 * to occur from the source to the target request.
 */
const EXTRA_HEADERS = ["content-type", "cache-control"];

class Puppeteer extends engine.Engine {
    constructor() {
        super();
        this.instance = null;
    }

    async init() {
        this.instance = await puppeteer.launch({
            args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-extensions"],
            dumpio: false,
            headless: "new"
        });
    }

    async destroy() {
        if (this.instance) await this.instance.close();
    }

    async reload() {
        await this.destroy();
        await this.init();
    }

    async version() {
        const browser = await this.instance.version();
        return `${puppeteerInfo.version} ${browser}`;
    }

    async render(req, res, next) {
        const url = req.query.url || "https://www.google.com/";
        const format = (req.query.format || "PNG").toLowerCase();
        const pageFormat = req.query.page_format || "A4";
        const waitUntil = req.query.wait_until || "load";
        const printBackground = req.query.print_background !== "0";
        const fullPage = req.query.full_page !== "0";
        const trim = req.query.trim === "1";
        const reload = req.query.reload === "1";
        const method = req.query.method || req.method;
        const body = req.body || null;
        const headers = req.headers || {};
        const width = parseInt(req.query.width || 800);
        const height = parseInt(req.query.width || 600);
        const scaleFactor = parseInt(req.query.scale_factor || 1);
        const timeout = parseInt(req.query.timeout || 500);
        const cookie = req.query.cookie || [];
        const isPdf = ["pdf"].indexOf(format) !== -1;
        const cookieA = Array.isArray(cookie) ? cookie : [cookie];

        // builds a new page instance (in a safe manner), taking
        // into consideration if the headless browser should be
        // reloaded as a "safety measure" avoiding typical error
        // related with browser re-usage
        const page = await this._newPage(reload);

        // "calculates" the final request headers filtering out the
        // ones that are not meant to be propagated
        const extraHeaders = Object.fromEntries(
            Object.entries(headers).filter(([key]) => EXTRA_HEADERS.includes(key))
        );

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
                    postData: bodyBuffer || "",
                    headers: Object.assign({}, request.headers(), extraHeaders)
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
                const data = await page.pdf({
                    format: pageFormat,
                    printBackground: printBackground
                });
                res.type("pdf");
                res.send(data);
            } else {
                // checks if the format is natively supported by puppeteer
                // and if that's not the case re-encoding is needed
                const reEncode = ["png", "jpeg", "webp"].indexOf(format) === -1;
                const type = reEncode ? "png" : format;

                let data = await page.screenshot({
                    fullPage: fullPage,
                    type: type
                });
                if (trim || reEncode) {
                    const image = await jimp.read(data);
                    if (trim) {
                        image.autocrop();
                    }
                    data = await image.getBufferAsync(`image/${format}`);
                }
                res.type(format);
                res.send(data);
            }
        } finally {
            await page.close();
        }
    }

    async _newPage(reload = false) {
        // in case reloading is requested then trigger the
        // reload of the current instance
        if (reload) await this.reload();

        let page = null;

        try {
            page = await this.instance.newPage();
        } catch (exception) {
            this.instance = await puppeteer.launch({
                args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-extensions"],
                dumpio: false,
                headless: "new"
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
