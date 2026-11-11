const assert = require("assert");
const http = require("http");
const jimp = require("jimp");
const util = require("hive-js-util");
const puppeteer = require("../../lib/engines/puppeteer");

describe("Puppeteer", function() {
    this.timeout(5000);

    beforeEach(async function() {
        const engine = new puppeteer.Puppeteer();
        try {
            await engine.init();
        } catch (err) {
            this.skip();
        }
        await engine.destroy();
    });

    it("should destroy without instance", async () => {
        const engine = new puppeteer.Puppeteer();
        await engine.destroy();
        assert.strictEqual(engine.instance, null);
    });

    it("should reload the browser", async () => {
        const engine = new puppeteer.Puppeteer();
        await engine.init();
        const instance = engine.instance;
        try {
            await engine.reload();
            assert.notStrictEqual(engine.instance, instance);
            assert.strictEqual(instance.connected, false);
            assert.strictEqual(engine.instance.connected, true);
        } finally {
            await engine.destroy();
        }
    });

    it("should return the version", async () => {
        const engine = new puppeteer.Puppeteer();
        await engine.init();
        try {
            const version = await engine.version();
            assert.match(version, /^\d+\.\d+\.\d+ (Headless)?Chrome\/[\d.]+$/);
        } finally {
            await engine.destroy();
        }
    });

    it("should render a PDF", async () => {
        const res = await tryRenderPage("pdf");
        assert.ok(res.data);
        assert.strictEqual(res.file, "pdf");
        assert.ok(res.data.slice(0, 5).equals(Buffer.from([0x25, 0x50, 0x44, 0x46, 0x2d])));
    });

    it("should render a PNG by default", async () => {
        const res = await tryRenderPage("png");
        assert.ok(res.data);
        assert.strictEqual(res.file, "png");
        assert.ok(
            res.data
                .slice(0, 8)
                .equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
        );
    });

    it("should render a PNG", async () => {
        const res = await tryRenderPage("png");
        assert.ok(res.data);
        assert.strictEqual(res.file, "png");
        assert.ok(
            res.data
                .slice(0, 8)
                .equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
        );
    });

    it("should render a JPEG", async () => {
        const res = await tryRenderPage("jpeg");
        assert.ok(res.data);
        assert.strictEqual(res.file, "jpeg");
        assert.ok(res.data.slice(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff])));
    });

    it("should render a WebP", async () => {
        const res = await tryRenderPage("webp");
        assert.ok(res.data);
        assert.strictEqual(res.file, "webp");
        assert.ok(res.data.slice(0, 4).equals(Buffer.from([0x52, 0x49, 0x46, 0x46])));
        assert.ok(res.data.slice(8, 12).equals(Buffer.from([0x57, 0x45, 0x42, 0x50])));
    });

    it("should render a TIFF", async () => {
        const res = await tryRenderPage("tiff");
        assert.ok(res.data);
        assert.strictEqual(res.file, "tiff");
        const littleEndian = res.data.slice(0, 4).equals(Buffer.from([0x49, 0x49, 0x2a, 0x00]));
        const bigEndian = res.data.slice(0, 4).equals(Buffer.from([0x4d, 0x4d, 0x00, 0x2a]));
        assert.ok(littleEndian || bigEndian);
    });

    it("should render a BMP", async () => {
        const res = await tryRenderPage("bmp");
        assert.ok(res.data);
        assert.strictEqual(res.file, "bmp");
        assert.ok(res.data.slice(0, 2).equals(Buffer.from([0x42, 0x4d])));
    });

    it("should render HTML contents", async () => {
        const res = await tryRenderPage(
            "png",
            { url: "" },
            Buffer.from('<html><body style="background: #ff0000;"></body></html>')
        );
        assert.ok(res.data);
        assert.strictEqual(res.file, "png");
        const image = await jimp.read(res.data);
        assert.deepStrictEqual(jimp.intToRGBA(image.getPixelColor(10, 10)), {
            r: 255,
            g: 0,
            b: 0,
            a: 255
        });
    });

    it("should not intercept the requests of HTML contents", async () => {
        const requests = [];
        const server = await startServer((req, res) => {
            requests.push([req.method, req.url]);
            res.end();
        });
        try {
            const url = `http://127.0.0.1:${server.address().port}/image.png`;
            const res = await tryRenderPage(
                "png",
                { url: "", method: "POST" },
                Buffer.from(`<html><body><img src="${url}" /></body></html>`)
            );
            assert.strictEqual(res.file, "png");
            assert.deepStrictEqual(requests, [["GET", "/image.png"]]);
        } finally {
            server.close();
        }
    });

    it("should send the payload of a POST request to the URL", async () => {
        const requests = [];
        const server = await startServer((req, res) => {
            let data = "";
            req.on("data", chunk => (data += chunk));
            req.on("end", () => {
                requests.push([req.method, req.url, data]);
                res.setHeader("Content-Type", "text/html");
                res.end("<html><body>payload</body></html>");
            });
        });
        try {
            const url = `http://127.0.0.1:${server.address().port}/`;
            const res = await tryRenderPage(
                "png",
                { url: url, method: "POST" },
                Buffer.from("payload")
            );
            assert.strictEqual(res.file, "png");
            assert.deepStrictEqual(requests[0], ["POST", "/", "payload"]);
        } finally {
            server.close();
        }
    });

    it("should prefer the CSS page size", async () => {
        const res = await tryRenderPage(
            "pdf",
            { url: "", prefer_css_page_size: "1" },
            Buffer.from(
                "<html><head><style>@page { size: A3; }</style></head><body>A3</body></html>"
            )
        );
        assert.strictEqual(res.file, "pdf");
        assert.deepStrictEqual(pageSize(res.data), [297, 420]);
    });

    it("should use the page format without preferring the CSS page size", async () => {
        const res = await tryRenderPage(
            "pdf",
            { url: "" },
            Buffer.from(
                "<html><head><style>@page { size: A3; }</style></head><body>A3</body></html>"
            )
        );
        assert.strictEqual(res.file, "pdf");
        assert.deepStrictEqual(pageSize(res.data), [210, 297]);
    });

    it("should not share cookies between requests", async () => {
        const cookies = [];
        const server = await startServer((req, res) => {
            if (req.url === "/") cookies.push(req.headers.cookie || null);
            res.setHeader("Content-Type", "text/html");
            res.end("<html><body>cookies</body></html>");
        });
        const engine = new puppeteer.Puppeteer();
        await engine.init();
        try {
            const url = `http://127.0.0.1:${server.address().port}/`;
            await renderPage(engine, "png", { url: url, cookie: "session,secret" });
            await renderPage(engine, "png", { url: url });
            assert.deepStrictEqual(cookies, ["session=secret", null]);
            assert.strictEqual(1, engine.instance.browserContexts().length);
        } finally {
            await engine.destroy();
            server.close();
        }
    });

    it("should use the size of the viewport", async () => {
        const res = await tryRenderPage("png", { width: "400", height: "300", full_page: "0" });
        const image = await jimp.read(res.data);
        assert.deepStrictEqual([image.bitmap.width, image.bitmap.height], [400, 300]);
    });

    it("should use the scale factor", async () => {
        const res = await tryRenderPage("png", {
            width: "400",
            height: "300",
            full_page: "0",
            scale_factor: "2"
        });
        const image = await jimp.read(res.data);
        assert.deepStrictEqual([image.bitmap.width, image.bitmap.height], [800, 600]);
    });

    it("should trim the image", async () => {
        const res = await tryRenderPage(
            "png",
            { url: "", width: "400", height: "300", full_page: "0", trim: "1" },
            Buffer.from(
                '<html><body style="margin: 0; background: #ffffff;">' +
                    '<div style="position: absolute; left: 150px; top: 125px; width: 100px; height: 50px; background: #ff0000;"></div>' +
                    "</body></html>"
            )
        );
        const image = await jimp.read(res.data);
        assert.deepStrictEqual([image.bitmap.width, image.bitmap.height], [100, 50]);
    });

    it("should use the timeout of the navigation", async () => {
        const server = await startServer((req, res) => {
            setTimeout(() => res.end("<html><body>late</body></html>"), 3000);
        });
        try {
            const url = `http://127.0.0.1:${server.address().port}/`;
            await assert.rejects(
                tryRenderPage("png", { url: url, timeout: "500" }),
                /Navigation timeout of 500 ms exceeded/
            );
        } finally {
            server.close();
        }
    });

    it("should send the extra headers of a POST request to the URL", async () => {
        const requests = [];
        const server = await startServer((req, res) => {
            requests.push([
                req.headers["content-type"],
                req.headers["cache-control"],
                req.headers["x-other"]
            ]);
            res.setHeader("Content-Type", "text/html");
            res.end("<html><body>headers</body></html>");
        });
        try {
            const url = `http://127.0.0.1:${server.address().port}/`;
            const res = await tryRenderPage(
                "png",
                { url: url, method: "POST" },
                Buffer.from("{}"),
                {
                    "content-type": "application/json",
                    "cache-control": "no-cache",
                    "x-other": "other"
                }
            );
            assert.strictEqual(res.file, "png");
            assert.deepStrictEqual(requests[0], ["application/json", "no-cache", undefined]);
        } finally {
            server.close();
        }
    });

    it("should reload the browser before rendering", async () => {
        const engine = new puppeteer.Puppeteer();
        await engine.init();
        const instance = engine.instance;
        try {
            const res = await renderPage(engine, "png", { reload: "1" });
            assert.strictEqual(res.file, "png");
            assert.notStrictEqual(engine.instance, instance);
            assert.strictEqual(instance.connected, false);
        } finally {
            await engine.destroy();
        }
    });

    it("should open new page", async () => {
        const engine = new puppeteer.Puppeteer();
        await engine.init();
        try {
            await engine._newPage();
            const pages = await engine.instance.pages();
            assert.strictEqual(2, pages.length);
        } finally {
            await engine.destroy();
        }
    });

    it("should open new page in a new context", async () => {
        const engine = new puppeteer.Puppeteer();
        await engine.init();
        try {
            const page = await engine._newPage();
            assert.notStrictEqual(page.browserContext(), engine.instance.defaultBrowserContext());
            assert.strictEqual(2, engine.instance.browserContexts().length);
        } finally {
            await engine.destroy();
        }
    });

    it("should open new page after the browser is closed", async () => {
        const engine = new puppeteer.Puppeteer();
        await engine.init();
        try {
            await engine.instance.close();
            const page = await engine._newPage();
            assert.ok(engine.instance.connected);
            assert.notStrictEqual(page.browserContext(), engine.instance.defaultBrowserContext());
        } finally {
            await engine.destroy();
        }
    });

    it("should log the errors of the page", async () => {
        const engine = new puppeteer.Puppeteer();
        await engine.init();
        const error = util.Logging.error;
        const errors = [];
        util.Logging.error = err => errors.push(err.message);
        try {
            const page = await engine._newPage();
            page.emit("error", new Error("Page crashed!"));
            assert.deepStrictEqual(errors, ["Page crashed!"]);
        } finally {
            util.Logging.error = error;
            await engine.destroy();
        }
    });

    const tryRenderPage = async (format = null, query = {}, body = {}, headers = {}) => {
        const engine = new puppeteer.Puppeteer();
        await engine.init();

        try {
            return await renderPage(engine, format, query, body, headers);
        } finally {
            await engine.destroy();
        }
    };

    const renderPage = async (engine, format = null, query = {}, body = {}, headers = {}) => {
        const req = {
            query: Object.assign(
                {
                    url: "https://example.com/",
                    format: format
                },
                query
            ),
            body: body,
            headers: headers
        };
        const res = {
            send: function(data) {
                this.data = data;
            },
            type: function(file) {
                this.file = file;
            }
        };
        await engine.render(req, res);
        return res;
    };

    const startServer = async handler => {
        const server = http.createServer(handler);
        await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
        return server;
    };

    const pageSize = data => {
        const match = data
            .toString("latin1")
            .match(/\/MediaBox\s*\[\s*[\d.]+\s+[\d.]+\s+([\d.]+)\s+([\d.]+)/);
        return [
            Math.round((parseFloat(match[1]) / 72) * 25.4),
            Math.round((parseFloat(match[2]) / 72) * 25.4)
        ];
    };
});
