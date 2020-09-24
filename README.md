# [Headless](https://headless.hive.pt)

Simple headless browser API to render images (PNG, JPEG, etc.) and PDFs from plain HTML.

## Features

* Capture of webpages as PNG and PDFs
* Multiple back-end engines: [Phantom.js](https://phantomjs.org) and [Puppeteer](https://github.com/GoogleChrome/puppeteer)

## Configuration

| Name           | Type  | Default | Description                                                                                                            |
| -------------- | ----- | ------- | ---------------------------------------------------------------------------------------------------------------------- |
| `HEADLESS_KEY` | `str` | `None`  | Secret key that should be passed in protected calls so that the server side "trusts" the client side (authentication). |

## License

Headless is currently licensed under the [Apache License, Version 2.0](http://www.apache.org/licenses/).

## Build Automation

[![Build Status](https://travis-ci.org/hivesolutions/headless.svg?branch=master)](https://travis-ci.org/hivesolutions/headless)
[![Build Status GitHub](https://github.com/hivesolutions/headless/workflows/Main%20Workflow/badge.svg)](https://github.com/hivesolutions/headless/actions)
[![npm Status](https://img.shields.io/npm/v/hive-headless.svg)](https://www.npmjs.com/package/hive-headless)
[![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg)](https://www.apache.org/licenses/)
