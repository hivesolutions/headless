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

    const tryRenderPage = async (format = null) => {
        const engine = new puppeteer.Puppeteer();
        await engine.init();

        try {
            const req = {
                query: {
                    url: "https://example.com/",
                    format: format
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
            return res;
        } finally {
            await engine.destroy();
        }
    };
});
