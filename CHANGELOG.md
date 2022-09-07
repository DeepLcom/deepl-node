# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).


## [1.6.0] - 2022-09-09
### Added
* New language available: Ukrainian (`'uk'`). Add language code constant and
  tests.

  Note: older library versions also support new languages, this update only
  adds new code constant.


## [1.5.0] - 2022-08-19
### Added
* Add proxy support.


## [1.4.0] - 2022-08-09
### Added
* Add `createGlossaryWithCsv()` allowing glossaries downloaded from website to
  be easily uploaded to API.


## [1.3.2] - 2022-08-09
### Changed
* Update contributing guidelines, we can now accept Pull Requests.
### Fixed
* Fix GitLab CI config.
* Correct language code case in `getSourceLanguages()` and 
  `getTargetLanguages()` result.
* Use TypeScript conditional types on `translateText()` to fix TS compiler
  errors.
  * Issue [#9](https://github.com/DeepLcom/deepl-node/issues/9) thanks to
    [Jannis Blossey](https://github.com/jblossey)


## [1.3.1] - 2022-05-18
Replaces version 1.3.0 which was broken due an incorrect package version. 
### Added
* New languages available: Indonesian (`'id'`) and Turkish (`'tr'`). Add
  language code constants and tests.

  Note: older library versions also support the new languages, this update only
  adds new code constants.
### Changed
* Change return type of `nonRegionalLanguageCode()` to newly-added type
  `NonRegionalLanguageCode`.


## [1.3.0] - 2022-05-18
Due to an incorrect package version, this version was removed. 


## [1.2.2] - 2022-04-20
### Added
* Glossaries are now supported for language pairs: English <-> Japanese and
  French <-> German. The corresponding glossary language code TypeScript types
  are extended.

  Note: older library versions also support the new glossary language pairs,
  this update only adds new types.


## [1.2.1] - 2022-04-14
### Changed
* Simplify and widen the accepted version range for `node` and `@types/node`. 


## [1.2.0] - 2022-04-13
### Added
* Add `errorMessage` property to `DocumentStatus`, describing the error in case
  of document translation failure.


## [1.1.1] - 2022-04-12
### Fixed
* Fix some tests that intermittently failed.
* Fix `isDocumentTranslationComplete()` to reject if document translation fails.


## [1.1.0] - 2022-03-22
### Added
- Add support for HTML tag handling.
### Fixed
- Fix spurious test failures. 


## [0.1.2] - 2022-03-10
### Changed
- Change TypeScript-example to match other examples.
- Improvements to code style and formatting.
- Increase TypeScript compiler target to `es2019`.


## [0.1.1] - 2022-03-04
### Fixed
- Fix error in package version.


## [0.1.0] - 2022-03-04
Initial release.


## 1.0.0 - 2019-02-04
This version of the package on NPM refers to an earlier unofficial DeepL Node.js
client library, which can be found [here][1.0.0]. The official DeepL Node.js
client library took over this package name. Thanks to
[Tristan De Oliveira](https://github.com/icrotz) for transferring the package
ownership.


[1.6.0]: https://github.com/DeepLcom/deepl-node/compare/v1.5.0...v1.6.0
[1.5.0]: https://github.com/DeepLcom/deepl-node/compare/v1.4.0...v1.5.0
[1.4.0]: https://github.com/DeepLcom/deepl-node/compare/v1.3.2...v1.4.0
[1.3.2]: https://github.com/DeepLcom/deepl-node/compare/v1.3.1...v1.3.2
[1.3.1]: https://github.com/DeepLcom/deepl-node/compare/v1.2.2...v1.3.1
[1.3.0]: https://github.com/DeepLcom/deepl-node/releases/tag/v1.3.0
[1.2.2]: https://github.com/DeepLcom/deepl-node/compare/v1.2.1...v1.2.2
[1.2.1]: https://github.com/DeepLcom/deepl-node/compare/v1.2.0...v1.2.1
[1.2.0]: https://github.com/DeepLcom/deepl-node/compare/v1.1.1...v1.2.0
[1.1.1]: https://github.com/DeepLcom/deepl-node/compare/v1.1.0...v1.1.1
[1.1.0]: https://github.com/DeepLcom/deepl-node/compare/v0.1.2...v1.1.0
[0.1.2]: https://github.com/DeepLcom/deepl-node/compare/v0.1.1...v0.1.2
[0.1.1]: https://github.com/DeepLcom/deepl-node/compare/v0.1.0...v0.1.1
[0.1.0]: https://github.com/DeepLcom/deepl-node/releases/tag/v0.1.0
[1.0.0]: https://github.com/icrotz/deepl
