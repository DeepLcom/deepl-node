// Copyright 2022 DeepL SE (https://www.deepl.com)
// Use of this source code is governed by an MIT
// license that can be found in the LICENSE file.

/**
 * Optional proxy configuration, may be specified as proxy in TranslatorOptions.
 * @see TranslatorOptions.proxy
 */
export interface ProxyConfig {
    host: string;
    port: number;
    auth?: {
        username: string;
        password: string;
    };
    protocol?: string;
}

/**
 * Options that can be specified when constructing a Translator.
 */
export interface TranslatorOptions {
    /**
     * Base URL of DeepL API, can be overridden for example for testing purposes. By default, the
     * correct DeepL API URL is selected based on the user account type (free or paid).
     */
    serverUrl?: string;

    /**
     * HTTP headers attached to every HTTP request. By default, no extra headers are used. Note that
     * during Translator initialization headers for Authorization and User-Agent are added, unless
     * they are overridden in this option.
     */
    headers?: Record<string, string>;

    /**
     * The maximum number of failed attempts that Translator will retry, per request. By default, 5
     * retries are made. Note: only errors due to transient conditions are retried.
     */
    maxRetries?: number;

    /**
     * Connection timeout used for each HTTP request retry, in milliseconds. The default timeout
     * if this value is unspecified is 10 seconds (10000).
     */
    minTimeout?: number;

    /**
     * Define the host, port and protocol of the proxy server.
     */
    proxy?: ProxyConfig;
}

export type Formality = 'less' | 'more' | 'default';
export type SentenceSplittingMode = 'off' | 'on' | 'nonewlines' | 'default';
export type TagHandlingMode = 'html' | 'xml';
export type GlossaryId = string;
export type TagList = string | string[];

/**
 * Information about a glossary, excluding the entry list.
 */
export interface GlossaryInfo {
    /** Unique ID assigned to the glossary. */
    readonly glossaryId: GlossaryId;
    /** User-defined name assigned to the glossary. */
    readonly name: string;
    /** Indicates whether the glossary may be used for translations. */
    readonly ready: boolean;
    /** Language code of the glossary source terms. */
    readonly sourceLang: SourceGlossaryLanguageCode;
    /** Language code of the glossary target terms. */
    readonly targetLang: TargetGlossaryLanguageCode;
    /** Time when the glossary was created. */
    readonly creationTime: Date;
    /** The number of entries contained in the glossary. */
    readonly entryCount: number;
}

/**
 * Options that can be specified when translating text.
 */
export interface TranslateTextOptions {
    /**
     * Specifies how input translation text should be split into sentences.
     * - 'on': Input translation text will be split into sentences using both newlines and
     *   punctuation, this is the default behaviour.
     * - 'off': Input translation text will not be split into sentences. This is advisable for
     *   applications where each input translation text is only one sentence.
     * - 'nonewlines': Input translation text will be split into sentences using only punctuation
     *   but not newlines.
     */
    splitSentences?: SentenceSplittingMode;

    /** Set to true to prevent the translation engine from correcting some formatting aspects, and
     * instead leave the formatting unchanged, default is false. */
    preserveFormatting?: boolean;

    /** Controls whether translations should lean toward formal or informal language. */
    formality?: Formality;

    /** Specifies the ID of a glossary to use with translation. */
    glossary?: GlossaryId | GlossaryInfo;

    /** Type of tags to parse before translation, options are 'html' and 'xml'. */
    tagHandling?: TagHandlingMode;

    /** Set to false to disable automatic tag detection, default is true. */
    outlineDetection?: boolean;

    /** List of XML tags that should be used to split text into sentences. */
    splittingTags?: TagList;

    /** List of XML tags that should not be used to split text into sentences. */
    nonSplittingTags?: TagList;

    /** List of XML tags containing content that should not be translated. */
    ignoreTags?: TagList;
}

/**
 * Options that can be specified when translating documents.
 */
export interface DocumentTranslateOptions {
    /** Controls whether translations should lean toward formal or informal language. */
    formality?: Formality;

    /** Specifies the ID of a glossary to use with translation. */
    glossary?: GlossaryId | GlossaryInfo;

    /** Filename including extension, only required when translating documents as streams. */
    filename?: string;
}

/**
 * Language codes that may be used as a source or target language.
 * Note: although the language code type definitions are case-sensitive, this package and the DeepL
 * API accept case-insensitive language codes.
 */
type CommonLanguageCode =
    | 'bg'
    | 'cs'
    | 'da'
    | 'de'
    | 'el'
    | 'es'
    | 'et'
    | 'fi'
    | 'fr'
    | 'hu'
    | 'id'
    | 'it'
    | 'ja'
    | 'lt'
    | 'lv'
    | 'nl'
    | 'pl'
    | 'ro'
    | 'ru'
    | 'sk'
    | 'sl'
    | 'sv'
    | 'tr'
    | 'uk'
    | 'zh';

/**
 * Language codes that may be used as a source language.
 * Note: although the language code type definitions are case-sensitive, this package and the DeepL
 * API accept case-insensitive language codes.
 */
export type SourceLanguageCode = CommonLanguageCode | 'en' | 'pt';

/**
 * Language codes that may be used as a target language.
 * Note: although the language code type definitions are case-sensitive, this package and the DeepL
 * API accept case-insensitive language codes.
 */
export type TargetLanguageCode = CommonLanguageCode | 'en-GB' | 'en-US' | 'pt-BR' | 'pt-PT';

/**
 * All language codes, including source-only and target-only language codes.
 * Note: although the language code type definitions are case-sensitive, this package and the DeepL
 * API accept case-insensitive language codes.
 */
export type LanguageCode = SourceLanguageCode | TargetLanguageCode;

/**
 * Language codes that do not include a regional variant, for example 'en' is included, but 'en-US'
 * is not.
 */
export type NonRegionalLanguageCode = CommonLanguageCode | 'en' | 'pt';

/**
 * Language codes that may be used as a source language for glossaries.
 * Note: although the language code type definitions are case-sensitive, this package and the DeepL
 * API accept case-insensitive language codes.
 */
export type SourceGlossaryLanguageCode = 'de' | 'en' | 'es' | 'fr' | 'ja';

/**
 * Language codes that may be used as a target language for glossaries.
 * Note: although the language code type definitions are case-sensitive, this package and the DeepL
 * API accept case-insensitive language codes.
 */
export type TargetGlossaryLanguageCode = SourceGlossaryLanguageCode;
