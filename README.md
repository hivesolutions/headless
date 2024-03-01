# [Headless](https://headless.hive.pt)

Simple headless browser API to render images (PNG, JPEG, WebP, etc.) and PDFs from plain HTML.

## Features

* Capture of webpages as PNG and PDFs
* Multiple back-end engines: [Phantom.js](https://phantomjs.org) and [Puppeteer](https://github.com/puppeteer/puppeteer)

## Configuration

| Name           | Type  | Default | Description                                                                                                            |
| -------------- | ----- | ------- | ---------------------------------------------------------------------------------------------------------------------- |
| `HEADLESS_KEY` | `str` | `None`  | Secret key that should be passed in protected calls so that the server-side "trusts" the client side (authentication). |

## Docker Images

Headless is available on Docker Hub with the following tags:

| Tag        | Description                                        | Supported Architectures                         |
| ---------- | -------------------------------------------------- | ----------------------------------------------- |
| `latest`   | The most up-to-date stable version.                | `linux/amd64`                                   |
| `debian`   | Debian-based container for stability and security. | `linux/amd64`                                   |
| `chromium` | Container using chromium instead of chrome.        | `linux/amd64`, `linux/arm/v7`, `linux/arm64/v8` |

## License

Headless is currently licensed under the [Apache License, Version 2.0](http://www.apache.org/licenses/).

## Build Automation

[![Build Status](https://app.travis-ci.com/hivesolutions/headless.svg?branch=master)](https://travis-ci.com/github/hivesolutions/headless)
[![Build Status GitHub](https://github.com/hivesolutions/headless/workflows/Main%20Workflow/badge.svg)](https://github.com/hivesolutions/headless/actions)
[![npm Status](https://img.shields.io/npm/v/hive-headless.svg)](https://www.npmjs.com/package/hive-headless)
[![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg)](https://www.apache.org/licenses/)

