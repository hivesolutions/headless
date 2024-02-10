const assert = require("assert");
const puppeteer = require("../../lib/engines/puppeteer");

describe("Puppeteer", function() {
    this.timeout(5000);

    it("should render a PDF", async () => {
        const engine = new puppeteer.Puppeteer();
        try {
            await engine.init();
        } catch (err) {
            this.skip();
        }

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

        await engine.destroy();
    });

    it("should open new page", async () => {
        const engine = new puppeteer.Puppeteer();
        try {
            await engine.init();
        } catch (err) {
            this.skip();
        }

        await engine._newPage();
        const pages = await engine.instance.pages();
        assert.strictEqual(2, pages.length);

        await engine.destroy();
    });
});
