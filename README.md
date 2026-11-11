# [Headless](https://headless.hive.pt)

Simple headless browser API to render images (PNG, JPEG, WebP, TIFF, BMP, etc.) and PDFs from plain HTML.

## Features

* Capture of webpages as PNG and PDFs
* Multiple back-end engines: [Phantom.js](https://phantomjs.org) and [Puppeteer](https://github.com/puppeteer/puppeteer)

## Configuration

| Name           | Type  | Default     | Description                                                                                                            |
| -------------- | ----- | ----------- | ---------------------------------------------------------------------------------------------------------------------- |
| `HEADLESS_KEY` | `str` | `None`      | Secret key that should be passed in protected calls so that the server-side "trusts" the client side (authentication). |
| `HOST`         | `str` | `127.0.0.1` | Address the server listens on (`0.0.0.0` in the Docker images).                                                        |
| `PORT`         | `int` | `3000`      | Port the server listens on (`8080` in the Docker images).                                                              |
| `LEVEL`        | `str` | `DEBUG`     | Logging level (`INFO` in the Docker images).                                                                           |

## Usage

### Routes

| Route   | Method | Description                                                                                                                                                                                                 |
| ------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/`     | `GET`  | Renders the page of `url` into the `format` requested and returns it (eg: `application/pdf`, `image/png`).                                                                                                  |
| `/`     | `POST` | Same as `GET`, the body of the request (any content type, up to 1 GB) is rendered as the HTML of the page when there's no `url`, otherwise it's sent as the payload of the request to `url` (see `method`). |
| `/info` | `GET`  | Returns a JSON with the name and the version of Headless, the version of Node.js and the version of each engine.                                                                                            |

The key (`HEADLESS_KEY`) is required by both `/` routes when configured, either as the `key` query parameter or in the `X-Headless-Key` header (preferred, as URLs end up in logs).

### Parameters

The query parameters of `/`, for the default engine (Puppeteer):

| Name                   | Type  | Default                   | Description                                                                                                                                                                                            |
| ---------------------- | ----- | ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `url`                  | `str` | `https://www.google.com/` | URL of the page to render (URL encoded). When missing, a request with a body renders its body as HTML instead.                                                                                         |
| `format`               | `str` | `png`                     | Format of the result: `pdf`, or an image format, `png`, `jpeg` and `webp` natively, `bmp`, `tiff` and `gif` re-encoded from PNG.                                                                       |
| `page_format`          | `str` | `A4`                      | Paper format of PDFs (eg: `A3`, `A4`, `A5`, `Letter`, `Legal`).                                                                                                                                        |
| `prefer_css_page_size` | `str` | -                         | `1` sizes PDFs by the `@page` rule of the document (eg: `@page { size: A3; }`), using `page_format` for the pages without one. Otherwise `page_format` wins, scaling the pages of other sizes into it. |
| `print_background`     | `str` | -                         | `0` leaves the backgrounds out of PDFs, which include them by default.                                                                                                                                 |
| `wait_until`           | `str` | `load`                    | Event the capture waits for: `load`, `domcontentloaded`, `networkidle0` (no network connections for 500 ms) or `networkidle2` (at most 2 connections for 500 ms).                                      |
| `full_page`            | `str` | -                         | `0` captures only the viewport in images, which capture the whole page by default.                                                                                                                     |
| `trim`                 | `str` | -                         | `1` crops the uniform borders of images.                                                                                                                                                               |
| `width`                | `int` | `800`                     | Width of the viewport in pixels.                                                                                                                                                                       |
| `height`               | `int` | `600`                     | Height of the viewport in pixels.                                                                                                                                                                      |
| `scale_factor`         | `int` | `1`                       | Device scale factor (eg: `2` for images with twice the resolution).                                                                                                                                    |
| `timeout`              | `int` | `30000`                   | Timeout in milliseconds of the navigation to `url` (or of the loading of the HTML body).                                                                                                               |
| `cookie`               | `str` | -                         | Cookie set for `url` as `name,value`, repeatable (eg: `cookie=a,1&cookie=b,2`). Each request renders in its own browser context, so its cookies never reach the other requests.                        |
| `method`               | `str` | Method of the request     | Method of the request to `url`. With `POST` or `PUT` the body of the request is sent as its payload, with its `Content-Type` and `Cache-Control` headers.                                              |
| `reload`               | `str` | -                         | `1` relaunches the browser before rendering, interrupting the renders of the other requests in progress.                                                                                               |
| `engine`               | `str` | `puppeteer`               | Engine of the render, `puppeteer` or `phantom` (when Phantom.js is installed), other engines are refused.                                                                                              |
| `key`                  | `str` | -                         | Key of the server, when it has one (`HEADLESS_KEY`).                                                                                                                                                   |

The Phantom engine (`engine=phantom`) reads `url`, `format` (`png`, `gif`, `jpeg` and `jpg`, or any format Phantom.js renders into a file, eg: `pdf`), `page_format` (`A2` by default), `zoom` (`1.0`), `viewport_width` (`1024`) and `viewport_height` (`768`).

The HTML of a body has no URL of its own (`about:blank`), so its resources (stylesheets, fonts and images) must have absolute URLs, a `<base href>` or be inlined (eg: as `data:` URIs), and no cookies are sent with them.

The errors are returned as a JSON with the message and the status code of the error, eg: `{"error": "Invalid key", "code": 500}` for a missing or invalid key, `{"error": "Invalid engine", "code": 500}` for an unknown `engine` (`500` is also the code of most failed renders) and `{"error": "Route not found", "code": 404}` for the other routes, with the `stack` of the error outside production (`NODE_ENV`).

### Examples

```bash
# renders a page into a PNG image of the whole page
curl -G "http://localhost:3000/" --data-urlencode "url=https://example.com/" -o page.png

# renders a page into an A4 PDF, waiting for the network to be idle
curl -G "http://localhost:3000/" --data-urlencode "url=https://example.com/" \
    -d format=pdf -d wait_until=networkidle0 -o page.pdf

# renders an HTML document into a PDF with the page size of its @page
# rule (eg: A3), sending the key in the header
curl -X POST "http://localhost:3000/?format=pdf&prefer_css_page_size=1" \
    -H "Content-Type: text/html" -H "X-Headless-Key: $HEADLESS_KEY" \
    --data-binary @page.html -o page.pdf
```

## Docker Images

Headless is available on [Docker Hub](https://hub.docker.com/r/hivesolutions/headless) with the following tags:

| Tag        | Description                                        | Supported Architectures       |
| ---------- | -------------------------------------------------- | ----------------------------- |
| `latest`   | The most up-to-date stable version.                | `amd64`                       |
| `debian`   | Debian-based container for stability and security. | `amd64`                       |
| `chromium` | Container using chromium instead of chrome.        | `amd64`, `arm/v7`, `arm64/v8` |

## Deployments

| Provider | Stable  | URL                                                      |
| -------- | ------- | -------------------------------------------------------- |
| Hosted   | `True`  | [headless.bemisc.com](https://headless.bemisc.com)       |
| Hosted   | `False` | [headless.stage.hive.pt](https://headless.stage.hive.pt) |

## License

Headless is currently licensed under the [Apache License, Version 2.0](http://www.apache.org/licenses/).

## Build Automation

[![Build Status](https://github.com/hivesolutions/headless/workflows/Main%20Workflow/badge.svg)](https://github.com/hivesolutions/headless/actions)
[![npm Status](https://img.shields.io/npm/v/hive-headless.svg)](https://www.npmjs.com/package/hive-headless)
[![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg)](https://www.apache.org/licenses/)
