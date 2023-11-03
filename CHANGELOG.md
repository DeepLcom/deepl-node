# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).


## [1.11.0] - 2023-11-03
### Added
* Add optional `context` parameter for text translation, that specifies
  additional context to influence translations, that is not translated itself.
### Changed
* Added notice in Readme that starting in 2024 the library will drop support for
  Node versions that are officially end-of-life.
* Keep-Alive is now used by HTTP(S) agent, to reduce latency for subsequent API requests.
### Fixed
* CI: silence npm audit warnings in non-production dependencies due to 
  currently-unresolvable [vulnerability in semver <7.5.2](https://github.com/npm/node-semver/pull/564). 
* Increase axios dependency to >=1.2.2, due to [bug in axios v1.2.1](https://github.com/axios/axios/issues/5346).
* Added supported glossary languages: Italian (it), Dutch (nl), Polish (pl),
  Portuguese (pt), Russian (ru) and Chinese (zh). The corresponding glossary
  language code TypeScript types are extended.

  Note: older library versions also support the new glossary language pairs,
  this update only adds new types.
* Fixed typo in readme: `createGlossaryWithCsv` not `createGlossaryFromCsv`
  * Issue [#36](https://github.com/DeepLcom/deepl-node/issues/36) thanks to
    [phenomen](https://github.com/phenomen). 


## [1.10.2] - 2023-06-02
### Fixed
* Fixed erroneous version bump

## [1.10.1] - 2023-06-02
### Fixed
* Limit example typescript version to 5.0 due to Node 12 incompatibility

## [1.10.0] - 2023-06-01
### Fixed
* Changed document translation to poll the server every 5 seconds. This should greatly reduce observed document translation processing time.
* Fix getUsage request to be a HTTP GET request, not POST.


## [1.9.0] - 2023-03-22
### Added
* Added platform and node version information to the user-agent string that is sent with API calls, along with an opt-out.
* Added method for applications that use this library to identify themselves in API requests they make.
### Fixed
* Fixed proxy example code in README


## [1.8.0] - 2023-01-26
### Added
* New languages available: Korean (`'ko'`) and Norwegian (bokmål) (`'nb'`). Add
  language code constants and tests.

  Note: older library versions also support the new languages, this update only
  adds new code constants.


## [1.7.5] - 2023-01-25
### Fixed
* Also send options in API requests even if they are default values.


## [1.7.4] - 2023-01-09
### Fixed
* Omit undefined `supportsFormality` field for source languages.


## [1.7.3] - 2023-01-04
### Changed
* CI: suppress `npm audit` warnings for dev dependencies, due to CVE in
  `eslint-plugin-import > tsconfig-paths > json5`.
### Fixed
* Support `axios` v1.2.1, that resolves the issue in v1.2.0.


## [1.7.2] - 2022-11-24
### Fixed
* Limit `axios` to v1.1.3 or lower due to an issue in v1.2.0.
  * This is a temporary workaround until the issue is resolved.


## [1.7.1] - 2022-10-12
### Fixed
* Prefer `for .. of` loops to `for .. in` loops, to handle cases where array
  prototype has been modified.
  * Issue [#10](https://github.com/DeepLcom/deepl-node/issues/10) thanks to
    [LorenzoJokhan](https://github.com/LorenzoJokhan)
* Node 18 is supported, this is now explicitly documented.


## [1.7.0] - 2022-09-30
### Added
* Add formality options `'prefer_less'` and `'prefer_more'`.
### Changed
* Requests resulting in `503 Service Unavailable` errors are now retried.
  Attempting to download a document before translation is completed will now
  wait and retry (up to 5 times by default), rather than rejecting.


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


[1.11.0]: https://github.com/DeepLcom/deepl-node/compare/v1.10.2...v1.11.0
[1.10.2]: https://github.com/DeepLcom/deepl-node/compare/v1.9.0...v1.10.2
[1.10.1]: https://github.com/DeepLcom/deepl-node/compare/v1.9.0...v1.10.1
[1.10.0]: https://github.com/DeepLcom/deepl-node/compare/v1.9.0...v1.10.0
[1.9.0]: https://github.com/DeepLcom/deepl-node/compare/v1.8.0...v1.9.0
[1.8.0]: https://github.com/DeepLcom/deepl-node/compare/v1.7.5...v1.8.0
[1.7.5]: https://github.com/DeepLcom/deepl-node/compare/v1.7.4...v1.7.5
[1.7.4]: https://github.com/DeepLcom/deepl-node/compare/v1.7.3...v1.7.4
[1.7.3]: https://github.com/DeepLcom/deepl-node/compare/v1.7.2...v1.7.3
[1.7.2]: https://github.com/DeepLcom/deepl-node/compare/v1.7.1...v1.7.2
[1.7.1]: https://github.com/DeepLcom/deepl-node/compare/v1.7.0...v1.7.1
[1.7.0]: https://github.com/DeepLcom/deepl-node/compare/v1.6.0...v1.7.0
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
