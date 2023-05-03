# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

*

### Changed

* Simplified trim operation to an all in memory operation

### Fixed

*

## [0.2.5] - 2023-04-02

### Changed

* New headless Chrome mode used for Puppeteer

### Fixed

* Issue with wrong handling of PDFs, that was generating memory leaks

## [0.2.4] - 2023-03-23

### Added

* Added CJK fonts

### Changed

* Bumped dependencies

## [0.2.3] - 2022-03-04

### Changed

* Added default error handler

### Fixed

* Bumped packages, puppeteer was broken

## [0.2.2] - 2021-10-22

### Changed

* Bumped version

## [0.2.1] - 2021-10-22

### Fixed

* Erroneous bumping of the eslint package

## [0.2.0] - 2021-10-22

### Added

* Reload flag support, with default value being `false`

### Changed

* Bumped packages

## [0.1.15] - 2021-04-15

### Changed

* Debian version of Dockerfile

## [0.1.14] - 2021-04-15

### Changed

* New Chrome initialization flags
* More efficient PDF processing

## [0.1.13] - 2021-04-15

### Changed

* Added new Chrome initialization flags
* Trying puppeteer version 8.x.x

## [0.1.12] - 2021-04-13

### Fixed

* Fixed puppeteer version back to 2.x.x

## [0.1.11] - 2021-04-12

### Fixed

* Fixed puppeteer version back to 5.3.1

## [0.1.10] - 2021-04-07

### Added

* Support for header propagation

## [0.1.9] - 2021-04-06

### Fixed

* Restored puppeteer version back to 5.x.x

## [0.1.8] - 2021-04-06

### Added

* Simple file touch

## [0.1.7] - 2021-04-05

### Fixed

* Issue with request interception
