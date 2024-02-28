const assert = require("assert");
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

    it("should render a PDF", async () => {
        const engine = new puppeteer.Puppeteer();
        await engine.init();

        try {
            const req = {
                query: {
                    url: "https://example.com/",
                    format: "pdf"
                },
                body: {}
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
            assert.ok(res.data);
            assert.strictEqual(res.file, "pdf");
        } finally {
            await engine.destroy();
        }
    });

    it("should render a jpeg", async () => {
        const engine = new puppeteer.Puppeteer();
        await engine.init();

        try {
            const req = {
                query: {
                    url: "https://example.com/",
                    format: "jpeg"
                },
                body: {}
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
            assert.ok(res.data);
            assert.strictEqual(res.file, "jpeg");
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
});
