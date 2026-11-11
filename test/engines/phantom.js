const assert = require("assert");
const fs = require("fs");
const jimp = require("jimp");
const phantom = require("../../lib/engines/phantom");

describe("Phantom", function() {
    this.timeout(5000);

    beforeEach(async function() {
        const engine = new phantom.Phantom();
        try {
            await engine.init();
            const page = await engine.instance.createPage();
            await page.close();
        } catch (err) {
            this.skip();
        } finally {
            await engine.destroy();
        }
    });

    it("should destroy without instance", async () => {
        const engine = new phantom.Phantom();
        await engine.destroy();
        assert.strictEqual(engine.instance, undefined);
    });

    it("should return the version", async () => {
        const engine = new phantom.Phantom();
        assert.match(await engine.version(), /^\d+\.\d+\.\d+$/);
    });

    it("should render a PNG by default", async () => {
        const res = await tryRenderPage();
        assert.strictEqual(res.file, "png");
        assert.ok(
            res.data
                .slice(0, 8)
                .equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
        );
    });

    it("should render a JPEG", async () => {
        const res = await tryRenderPage("jpeg");
        assert.strictEqual(res.file, "jpeg");
        assert.ok(res.data.slice(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff])));
    });

    it("should render a PDF", async () => {
        const res = await tryRenderPage("pdf");
        assert.strictEqual(res.file, "pdf");
        assert.ok(res.data.slice(0, 5).equals(Buffer.from([0x25, 0x50, 0x44, 0x46, 0x2d])));
        assert.strictEqual(fs.existsSync(res.path), false);
    });

    it("should remove the file of a PDF that fails to be sent", async () => {
        const engine = new phantom.Phantom();
        await engine.init();
        try {
            const res = response(new Error("Failed to send"));
            await assert.rejects(renderPage(engine, "pdf", {}, res), /Failed to send/);
            assert.ok(res.path);
            assert.strictEqual(fs.existsSync(res.path), false);
        } finally {
            await engine.destroy();
        }
    });

    it("should use the size of the viewport", async () => {
        const res = await tryRenderPage("png", {
            url: "about:blank",
            viewport_width: "400",
            viewport_height: "300"
        });
        const image = await jimp.read(res.data);
        assert.deepStrictEqual([image.bitmap.width, image.bitmap.height], [400, 300]);
    });

    const tryRenderPage = async (format = null, query = {}) => {
        const engine = new phantom.Phantom();
        await engine.init();

        try {
            return await renderPage(engine, format, query);
        } finally {
            await engine.destroy();
        }
    };

    const renderPage = async (engine, format = null, query = {}, res = response()) => {
        const req = {
            query: Object.assign(
                {
                    url: "https://example.com/",
                    format: format
                },
                query
            )
        };
        await engine.render(req, res);
        return res;
    };

    const response = (error = null) => {
        return {
            send: function(data) {
                this.data = data;
            },
            type: function(file) {
                this.file = file;
            },
            sendFile: function(path, options, callback) {
                this.path = path;
                this.file = path.split(".").pop();
                if (error) {
                    callback(error);
                    return;
                }
                this.data = fs.readFileSync(path);
                callback();
            }
        };
    };
});
