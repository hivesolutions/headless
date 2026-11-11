const assert = require("assert");
const childProcess = require("child_process");
const http = require("http");
const path = require("path");
const info = require("../package");

describe("App", function() {
    this.timeout(30000);

    it("should render a page", async () => {
        const server = await startServer((req, res) => {
            res.setHeader("Content-Type", "text/html");
            res.end("<html><body>page</body></html>");
        });
        try {
            const page = `http://127.0.0.1:${server.address().port}/`;
            const res = await tryRequest("GET", `/?url=${encodeURIComponent(page)}`, null, {
                "X-Headless-Key": "secret"
            });
            assert.strictEqual(res.status, 200);
            assert.strictEqual(res.type, "image/png");
            assert.ok(
                res.data
                    .slice(0, 8)
                    .equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
            );
        } finally {
            server.close();
        }
    });

    it("should not render a page without key", async () => {
        const res = await tryRequest("GET", "/?url=https://example.com/");
        const result = JSON.parse(res.data);
        assert.strictEqual(res.status, 500);
        assert.strictEqual(result.error, "Invalid key");
        assert.strictEqual(result.code, 500);
        assert.ok(Array.isArray(result.stack));
    });

    it("should not render a page with an unknown engine", async () => {
        const res = await tryRequest("GET", "/?engine=unknown", null, {
            "X-Headless-Key": "secret"
        });
        assert.strictEqual(res.status, 500);
        assert.strictEqual(JSON.parse(res.data).error, "Invalid engine");
    });

    it("should render posted HTML contents", async () => {
        const res = await tryRequest(
            "POST",
            "/?format=pdf&prefer_css_page_size=1",
            "<html><head><style>@page { size: A3; }</style></head><body>page</body></html>",
            { "Content-Type": "text/html", "X-Headless-Key": "secret" }
        );
        assert.strictEqual(res.status, 200);
        assert.strictEqual(res.type, "application/pdf");
        assert.ok(res.data.slice(0, 5).equals(Buffer.from([0x25, 0x50, 0x44, 0x46, 0x2d])));
    });

    it("should not render posted contents with an unknown engine", async () => {
        const res = await tryRequest("POST", "/?engine=unknown", "<html></html>", {
            "Content-Type": "text/html",
            "X-Headless-Key": "secret"
        });
        assert.strictEqual(res.status, 500);
        assert.strictEqual(JSON.parse(res.data).error, "Invalid engine");
    });

    it("should return the info", async () => {
        const res = await tryRequest("GET", "/info");
        const result = JSON.parse(res.data);
        assert.strictEqual(res.status, 200);
        assert.strictEqual(result.name, info.name);
        assert.strictEqual(result.version, info.version);
        assert.strictEqual(typeof result.node, "string");
        assert.deepStrictEqual(
            result.engines.map(([name]) => name),
            ["phantom", "puppeteer"]
        );
    });

    it("should not find other routes", async () => {
        const res = await tryRequest("GET", "/other");
        assert.strictEqual(res.status, 404);
        assert.deepStrictEqual(JSON.parse(res.data), { error: "Route not found", code: 404 });
    });

    it("should not return the stack of the errors in production", async () => {
        const res = await tryRequest(
            "GET",
            "/?url=https://example.com/",
            null,
            {},
            {
                NODE_ENV: "production"
            }
        );
        assert.strictEqual(res.status, 500);
        assert.deepStrictEqual(JSON.parse(res.data), { error: "Invalid key", code: 500 });
    });

    it("should keep serving when an engine fails to init", async () => {
        const [app, url] = await startApp(
            { HEADLESS_KEY: "secret", PUPPETEER_EXECUTABLE_PATH: "/nonexistent/chrome" },
            "/other",
            404
        );
        try {
            await new Promise(resolve => setTimeout(resolve, 1000));
            const res = await request("GET", `${url}/other`);
            assert.strictEqual(res.status, 404);
            assert.strictEqual(app.exitCode, null);
        } finally {
            await stopApp(app);
        }
    });

    const tryRequest = async (method, route, body = null, headers = {}, env = {}) => {
        const [app, url] = await startApp(Object.assign({ HEADLESS_KEY: "secret" }, env));

        try {
            return await request(method, url + route, body, headers);
        } finally {
            await stopApp(app);
        }
    };

    const startApp = async (env = {}, route = "/info", status = 200) => {
        const port = await freePort();
        const app = childProcess.spawn(process.execPath, [path.join(__dirname, "..", "app.js")], {
            env: Object.assign({}, process.env, { HOST: "127.0.0.1", PORT: String(port) }, env),
            stdio: "ignore"
        });
        const url = `http://127.0.0.1:${port}`;
        for (let index = 0; index < 200; index++) {
            try {
                const res = await request("GET", url + route);
                if (res.status === status) return [app, url];
            } catch (err) {
                // the app is not yet listening, retries the request
            }
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        await stopApp(app);
        throw new Error("App not started");
    };

    const stopApp = async app => {
        if (app.exitCode !== null) return;
        await new Promise(resolve => {
            app.on("exit", resolve);
            app.kill("SIGTERM");
        });
    };

    const startServer = async handler => {
        const server = http.createServer(handler);
        await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
        return server;
    };

    const freePort = async () => {
        const server = await startServer(() => {});
        const port = server.address().port;
        await new Promise(resolve => server.close(resolve));
        return port;
    };

    const request = (method, url, body = null, headers = {}) => {
        return new Promise((resolve, reject) => {
            const req = http.request(url, { method: method, headers: headers }, res => {
                const chunks = [];
                res.on("data", chunk => chunks.push(chunk));
                res.on("end", () =>
                    resolve({
                        status: res.statusCode,
                        type: (res.headers["content-type"] || "").split(";")[0],
                        data: Buffer.concat(chunks)
                    })
                );
            });
            req.on("error", reject);
            if (body) req.write(body);
            req.end();
        });
    };
});
