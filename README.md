# deepl-node

[![Version](https://img.shields.io/npm/v/deepl-node.svg)](https://www.npmjs.org/package/deepl-node)
[![Minimum node.js version](https://img.shields.io/node/v/deepl-node.svg)](https://npmjs.com/package/deepl-node)
[![License: MIT](https://img.shields.io/badge/license-MIT-blueviolet.svg)](https://github.com/DeepLcom/deepl-node/blob/main/LICENSE)

Official Node.js Client Library for the DeepL API.

The [DeepL API][api-docs] is a language translation API that allows other
computer programs to send texts and documents to DeepL's servers and receive
high-quality translations. This opens a whole universe of opportunities for
developers: any translation product you can imagine can now be built on top of
DeepL's best-in-class translation technology.

The DeepL Node.js library offers a convenient way for applications written for
Node.js to interact with the DeepL API. We intend to support all API functions
with the library, though support for new features may be added to the library
after they’re added to the API.

## Getting an authentication key

To use the package, you'll need an API authentication key. To get a key,
[please create an account here][create-account]. With a DeepL API Free account
you can translate up to 500,000 characters/month for free.

## Installation

`npm install deepl-node`

### Requirements

The package officially supports Node.js version 12, 14, 16, 17, and 18.

Starting in 2024, we will drop support for older Node versions that have reached
official end-of-life. You can find the Node versions and support timelines
[here][node-version-list].
To continue using this library, you should update to Node 18+.

## Usage

Import the package and construct a `Translator`. The first argument is a string
containing your API authentication key as found in your
[DeepL Pro Account][pro-account].

Be careful not to expose your key, for example when sharing source code.

An example using `async`/`await` and ES Modules:

```javascript
import * as deepl from 'deepl-node';

const authKey = "f63c02c5-f056-..."; // Replace with your key
const translator = new deepl.Translator(authKey);

(async () => {
    const result = await translator.translateText('Hello, world!', null, 'fr');
    console.log(result.text); // Bonjour, le monde !
})();
```

This example is for demonstration purposes only. In production code, the
authentication key should not be hard-coded, but instead fetched from a
configuration file or environment variable.

If you are using CommonJS, you should instead require the package:

```javascript
const deepl = require('deepl-node');
const translator = new deepl.Translator(authKey);
```

`Translator` accepts options as the second argument, see
[Configuration](#configuration) for more information.

All `Translator` functions return promises, and for brevity the examples in this
file use `await` and `try`/`catch` blocks, however Promise-chaining is also
possible:

```javascript
translator
    .translateText('Hello, world!', null, 'fr')
    .then((result) => {
        console.log(result.text); // Bonjour, le monde !
    })
    .catch((error) => {
        console.error(error);
    });
```

The package also supports TypeScript:

```typescript
import * as deepl from 'deepl-node';

(async () => {
    const targetLang: deepl.TargetLanguageCode = 'fr';
    const results = await translator.translateText(
        ['Hello, world!', 'How are you?'],
        null,
        targetLang,
    );
    results.map((result: deepl.TextResult) => {
        console.log(result.text); // Bonjour, le monde !
    });
})();
```

### Translating text

To translate text, call `translateText()`. The first argument is a string
containing the text you want to translate, or an array of strings if you want to
translate multiple texts.

The second and third arguments are the source and target language codes.
Language codes are **case-insensitive** strings according to ISO 639-1, for
example `'de'`, `'fr'`, `'ja''`. Some target languages also include the regional
variant according to ISO 3166-1, for example `'en-US'`, or `'pt-BR'`. The source
language also accepts `null`, to enable auto-detection of the source language.

The last argument to `translateText()` is optional, and specifies extra
translation options, see [Text translation options](#text-translation-options)
below.

`translateText()` returns a Promise that fulfills with a `TextResult`, or an
array of `TextResult`s corresponding to your input text(s). `TextResult` has two
properties: `text` is the translated text, and `detectedSourceLang` is the
detected source language code.

```javascript
// Translate text into a target language, in this case, French:
const translationResult = await translator.translateText('Hello, world!', 'en', 'fr');
console.log(translationResult.text); // 'Bonjour, le monde !'

// Translate multiple texts into British English:
const translations = await translator.translateText(
    ['お元気ですか？', '¿Cómo estás?'],
    null,
    'en-GB',
);
console.log(translations[0].text); // 'How are you?'
console.log(translations[0].detectedSourceLang); // 'ja'
console.log(translations[1].text); // 'How are you?'
console.log(translations[1].detectedSourceLang); // 'es'

// Translate into German with less and more Formality:
console.log(await translator.translateText('How are you?', null, 'de', { formality: 'less' })); // 'Wie geht es dir?'
console.log(await translator.translateText('How are you?', null, 'de', { formality: 'more' })); // 'Wie geht es Ihnen?'
```

#### Text translation options

-   `splitSentences`: specify how input text should be split into sentences,
    default: `'on'`.
    -   `'on'`: input text will be split into sentences using both newlines and
        punctuation.
    -   `'off'`: input text will not be split into sentences. Use this for
        applications where each input text contains only one sentence.
    -   `'nonewlines'`: input text will be split into sentences using punctuation
        but not newlines.
-   `preserveFormatting`: controls automatic-formatting-correction. Set to `true`
    to prevent automatic-correction of formatting, default: `false`.
-   `formality`: controls whether translations should lean toward informal or
    formal language. This option is only available for some target languages, see
    [Listing available languages](#listing-available-languages). Use the
    `prefer_*` options to apply formality if it is available for the target  
    language, or otherwise fallback to the default.
    - `'less'`: use informal language.
    - `'more'`: use formal, more polite language.
    - `'default'`: use default formality.
    - `'prefer_less'`: use informal language if available, otherwise default.
    - `'prefer_more'`: use formal, more polite language if available, otherwise default.
-   `glossary`: specifies a glossary to use with translation, either as a string
    containing the glossary ID, or a `GlossaryInfo` as returned by
    `getGlossary()`.
-   `context`: specifies additional context to influence translations, that is not
    translated itself. Note this is an **alpha feature**: it may be deprecated at
    any time, or incur charges if it becomes generally available.
    See the [API documentation][api-docs-context-param] for more information and
    example usage.
-   `tagHandling`: type of tags to parse before translation, options are `'html'`
    and `'xml'`.

The following options are only used if `tagHandling` is `'xml'`:

-   `outlineDetection`: specify `false` to disable automatic tag detection,
    default is `true`.
-   `splittingTags`: list of XML tags that should be used to split text into
    sentences. Tags may be specified as an array of strings (`['tag1', 'tag2']`),
    or a comma-separated list of strings (`'tag1,tag2'`). The default is an empty
    list.
-   `nonSplittingTags`: list of XML tags that should not be used to split text
    into sentences. Format and default are the same as for `splittingTags`.
-   `ignoreTags`: list of XML tags that containing content that should not be
    translated. Format and default are the same as for `splittingTags`.

### Translating documents

To translate documents, call `translateDocument()`. The first and second
arguments are the input and output files. These arguments accept strings
containing file paths, or Streams or FileHandles opened for reading/writing. The
input file may also be given as a Buffer containing the file data. Note that if
the input file is not given as a file path, then the `filename` option is
required.

The third and fourth arguments are the source and target language codes, and
they work exactly the same as when translating text with `translateText()`.

The last argument to `translateDocument()` is optional, and specifies extra
translation options, see
[Document translation options](#document-translation-options) below.

```javascript
// Translate a formal document from English to German:
try {
    await translator.translateDocument(
        'Instruction Manual.docx',
        'Bedienungsanleitung.docx',
        'en',
        'de',
        { formality: 'more' },
    );
} catch (error) {
    // If the error occurs after the document was already uploaded,
    // documentHandle will contain the document ID and key
    if (error.documentHandle) {
        const handle = error.documentHandle;
        console.log(`Document ID: ${handle.documentId}, ` + `Document key: ${handle.documentKey}`);
    } else {
        console.log(`Error occurred during document upload: ${error}`);
    }
}
```

`translateDocument()` wraps multiple API calls: uploading, polling status until
the translation is complete, and downloading. If your application needs to
execute these steps individually, you can instead use the following functions
directly:

-   `uploadDocument()`,
-   `getDocumentStatus()` (or `isDocumentTranslationComplete()`), and
-   `downloadDocument()`

#### Document translation options

-   `formality`: same as in [Text translation options](#text-translation-options).
-   `glossary`: same as in [Text translation options](#text-translation-options).
-   `filename`: if the input file is not provided as file path, this option is
    needed to specify the file extension.

### Glossaries

Glossaries allow you to customize your translations using defined terms.
Multiple glossaries can be stored with your account, each with a user-specified
name and a uniquely-assigned ID.

You can create a glossary with your desired terms and name using
`createGlossary()`. Each glossary applies to a single source-target language
pair. Note: glossaries are only supported for some language pairs, check the
[DeepL API documentation][api-docs] for more information.

```javascript
// Create an English to German glossary with two terms:
const entries = new deepl.GlossaryEntries({ entries: { artist: 'Maler', prize: 'Gewinn' } });
const glossaryEnToDe = await translator.createGlossary('My glossary', 'en', 'de', entries);
```

You can also upload a glossary downloaded from the DeepL website using
`createGlossaryWithCsv()`. Instead of supplying the entries as a dictionary,
provide the CSV file as a string containing the file path, or a Stream, Buffer,
or FileHandle containing the CSV file content:

```javascript
const csvFilePath = '/path/to/glossary_file.csv';
const glossaryEnToDe = await translator.createGlossaryWithCsv(
    'My glossary',
    'en',
    'de',
    csvFilePath);
```

The [API documentation][api-docs-csv-format] explains the expected CSV format in
detail.

Functions to get, list, and delete stored glossaries are also provided.

```javascript
// Find details about the glossary named 'My glossary'
const glossaries = await translator.listGlossaries();
const glossary = glossaries.find((glossary) => glossary.name == 'My glossary');
console.log(
    `Glossary ID: ${glossary.glossaryId}, source: ${glossary.sourceLang}, ` +
        `target: ${glossary.targetLang}, contains ${glossary.entryCount} entries.`,
);
```

To use a glossary when translating text and documents, include the ID
(or `Glossary` object returned by `listGlossaries()` or `createGlossary()`) in
the function call. The source and target languages must match the glossary.

```javascript
const resultWithGlossary = await translator.translateText(
    'The artist was awarded a prize.',
    'en',
    'de',
    { glossary },
);
console.log(resultWithGlossary.text); // 'Der Maler wurde mit einem Gewinn ausgezeichnet.'
// Without using a glossary would give:  'Der Künstler wurde mit einem Preis ausgezeichnet.'
```

### Checking account usage

To check account usage, use the `getUsage()` function.

The returned `Usage` object contains up to three usage subtypes, depending on
your account type: `character`, `document` and `teamDocument`. For API accounts
`character` will be defined, the others `undefined`.

Each usage subtypes (if defined) have `count` and `limit` properties giving the
amount used and maximum amount respectively, and the `limitReached()` function
that checks if the usage has reached the limit. The top level `Usage` object has
the `anyLimitReached()` function to check all usage subtypes.

```javascript
const usage = await translator.getUsage();
if (usage.anyLimitReached()) {
    console.log('Translation limit exceeded.');
}
if (usage.character) {
    console.log(`Characters: ${usage.character.count} of ${usage.character.limit}`);
}
if (usage.document) {
    console.log(`Documents: ${usage.document.count} of ${usage.document.limit}`);
}
```

### Listing available languages

You can request the list of languages supported by DeepL Translator for text and
documents using the `getSourceLanguages()` and `getTargetLanguages()` functions.
They both return an array of `Language` objects.

The `name` property gives the name of the language in English, and the `code`
property gives the language code. The `supportsFormality` property only appears
for target languages, and is a `Boolean` indicating whether the target language
supports the optional `formality` parameter.

```javascript
const sourceLanguages = await translator.getSourceLanguages();
for (let i = 0; i < sourceLanguages.length; i++) {
    const lang = sourceLanguages[i];
    console.log(`${lang.name} (${lang.code})`); // Example: 'English (en)'
}

const targetLanguages = await translator.getTargetLanguages();
for (let i = 0; i < targetLanguages.length; i++) {
    const lang = targetLanguages[i];
    if (lang.supportsFormality) {
        console.log(`${lang.name} (${lang.code}) supports formality`);
        // Example: 'German (DE) supports formality'
    }
}
```

Glossaries are supported for a subset of language pairs. To retrieve those
languages use the `getGlossaryLanguagePairs()` function, which returns an array
of `GlossaryLanguagePair` objects. Each has `sourceLang` and `targetLang`
properties indicating that that pair of language codes is supported for
glossaries.

```javascript
const glossaryLanguages = await translator.getGlossaryLanguagePairs();
for (let i = 0; i < glossaryLanguages.length; i++) {
    const languagePair = glossaryLanguages[i];
    console.log(`${languagePair.sourceLang} to ${languagePair.targetLang}`);
    // Example: 'en to de', 'de to en', etc.
}
```

### Writing a Plugin

If you use this library in an application, please identify the application with
the `appInfo` field in the `TranslatorOptions`, which takes the name and version of the app:

```javascript
const options = {appInfo: { appName: 'sampleNodeTranslationApp', appVersion: '1.2.3' },};
const deepl = new deepl.Translator('YOUR_AUTH_KEY', options);
```

This information is passed along when the library makes calls to the DeepL API.
Both name and version are required.

### Configuration

The `Translator` constructor accepts configuration options as a second argument,
for example:

```javascript
const options = { maxRetries: 5, minTimeout: 10000 };
const deepl = new deepl.Translator('YOUR_AUTH_KEY', options);
```

The available options are:

-   `maxRetries`: the maximum `Number` of failed HTTP requests to retry, per
    function call. By default, 5 retries are made. See
    [Request retries](#request-retries).
-   `minTimeout`: the `Number` of milliseconds used as connection timeout for each
    HTTP request retry. The default value is 10000 (10 seconds).
-   `serverUrl`: `string` containing the URL of the DeepL API, can be overridden
    for example for testing purposes. By default, the URL is selected based on the
    user account type (free or paid).
-   `headers`: extra HTTP headers attached to every HTTP request. By default, no
    extra headers are used. Note that Authorization and User-Agent headers are
    added automatically but may be overridden by this option.
-   `proxy`: define the hostname, and port of the proxy server, and optionally
    the protocol, and authorization (as an auth object with username and
    password fields).

#### Logging

`deepl-node` logs debug and info messages for every HTTP request and response
using the `loglevel` module, to the `'deepl'` logger. You can reconfigure the
log level as follows:

```javascript
import log from 'loglevel';

log.getLogger('deepl').setLevel('debug'); // Or 'info'
```

The `loglevel` package also supports plugins, see
[the documentation](https://www.npmjs.com/package/loglevel#plugins).

#### Proxy configuration

You can configure a proxy by specifying the `proxy` argument when constructing a
`deepl.Translator`:

```javascript
const options = {proxy: {host: 'localhost', port: 3000}};
const deepl = new deepl.Translator('YOUR_AUTH_KEY', options);
```

The proxy argument is passed to the underlying `axios` request, see the
[documentation for axios][axios-proxy-docs].

#### Anonymous platform information

By default, we send some basic information about the platform the client library
is running on with each request, see [here for an explanation](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/User-Agent).
This data is completely anonymous and only used to improve our product, not track
any individual users. If you do not wish to send this data, you can opt-out when
creating your `Translator` object by setting the `sendPlatformInfo` flag in
the `TranslatorOptions` to `false` like so:

```javascript
const options = {sendPlatformInfo: false};
const deepl = new deepl.Translator('YOUR_AUTH_KEY', options);
```

### Request retries

Requests to the DeepL API that fail due to transient conditions (for example,
network timeouts or high server-load) will be retried. The maximum number of
retries can be configured when constructing the `Translator` object using the
`maxRetries` option. The timeout for each request attempt may be controlled
using the `minTimeout` option. An exponential-backoff strategy is used, so
requests that fail multiple times will incur delays.

## Issues

If you experience problems using the library, or would like to request a new
feature, please open an [issue][issues].

## Development

We welcome Pull Requests, please read the
[contributing guidelines](CONTRIBUTING.md).

### Tests

Execute the tests using `npm test`. The tests communicate with the DeepL API
using the authentication key defined by the `DEEPL_AUTH_KEY` environment
variable.

Be aware that the tests make DeepL API requests that contribute toward your API
usage.

The test suite may instead be configured to communicate with the mock-server
provided by [deepl-mock][deepl-mock]. Although most test cases work for either,
some test cases work only with the DeepL API or the mock-server and will be
otherwise skipped. The test cases that require the mock-server trigger server
errors and test the client error-handling. To execute the tests using
deepl-mock, run it in another terminal while executing the tests. Execute the
tests using `npm test` with the `DEEPL_MOCK_SERVER_PORT` and `DEEPL_SERVER_URL`
environment variables defined referring to the mock-server.

[api-docs]: https://www.deepl.com/docs-api?utm_source=github&utm_medium=github-nodejs-readme
[api-docs-context-param]: https://www.deepl.com/docs-api/translating-text/?utm_source=github&utm_medium=github-nodejs-readme
[api-docs-csv-format]: https://www.deepl.com/docs-api/managing-glossaries/supported-glossary-formats/?utm_source=github&utm_medium=github-nodejs-readme
[axios-proxy-docs]: https://axios-http.com/docs/req_config
[create-account]: https://www.deepl.com/pro?utm_source=github&utm_medium=github-nodejs-readme#developer
[deepl-mock]: https://www.github.com/DeepLcom/deepl-mock
[issues]: https://www.github.com/DeepLcom/deepl-node/issues
[node-version-list]: https://nodejs.dev/en/about/releases/
[pro-account]: https://www.deepl.com/pro-account/?utm_source=github&utm_medium=github-nodejs-readme
