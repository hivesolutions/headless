const assert = require("assert");
const puppeteer = require("../lib/engines/puppeteer");

describe("PUPPETEER", function() {
    this.timeout(5000);

    it("should render a pdf", async () => {
        const engine = new puppeteer.Puppeteer();
        await engine.init();

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
        await engine.init();

        await engine._newPage();
        const pages = await engine.instance.pages();
        assert.strictEqual(2, pages.length);

        await engine.destroy();
    });
});
