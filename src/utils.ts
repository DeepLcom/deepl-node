// Copyright 2022 DeepL SE (https://www.deepl.com)
// Use of this source code is governed by an MIT
// license that can be found in the LICENSE file.

import loglevel from 'loglevel';
import { DeepLError } from './errors';
import {
    Formality,
    GlossaryInfo,
    GlossaryId,
    LanguageCode,
    NonRegionalLanguageCode,
    RequestParameters,
    SentenceSplittingMode,
    TagList,
    TranslateTextOptions,
} from './types';

const logger = loglevel.getLogger('deepl');

function concatLoggingArgs(args?: object): string {
    let detail = '';
    if (args) {
        for (const [key, value] of Object.entries(args)) {
            detail += `, ${key} = ${value}`;
        }
    }
    return detail;
}

export function logDebug(message: string, args?: object) {
    logger.debug(message + concatLoggingArgs(args));
}

export function logInfo(message: string, args?: object) {
    logger.info(message + concatLoggingArgs(args));
}

/**
 * Converts contents of given stream to a Buffer.
 * @private
 */
export async function streamToBuffer(stream: NodeJS.ReadableStream): Promise<Buffer> {
    const chunks: Buffer[] = [];
    return new Promise((resolve, reject) => {
        stream.on('data', (chunk: Buffer) => chunks.push(chunk));
        stream.on('error', (err) => reject(err));
        stream.on('end', () => resolve(Buffer.concat(chunks)));
    });
}

/**
 * Converts contents of given stream to a string using UTF-8 encoding.
 * @private
 */
export async function streamToString(stream: NodeJS.ReadableStream): Promise<string> {
    return (await streamToBuffer(stream)).toString('utf8');
}

// Wrap setTimeout() with Promise
export const timeout = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Returns true if the given argument is a string.
 * @param arg Argument to check.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function isString(arg: any): arg is string {
    return typeof arg === 'string';
}

/**
 * Returns '1' if the given arg is truthy, '0' otherwise.
 * @param arg Argument to check.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function toBoolString(arg: any): string {
    return arg ? '1' : '0';
}

/**
 * Returns true if the specified DeepL Authentication Key is associated with a free account,
 * otherwise false.
 * @param authKey The authentication key to check.
 * @return True if the key is associated with a free account, otherwise false.
 */
export function isFreeAccountAuthKey(authKey: string): boolean {
    return authKey.endsWith(':fx');
}

/**
 * Changes the upper- and lower-casing of the given language code to match ISO 639-1 with an
 * optional regional code from ISO 3166-1.
 * For example, input 'EN-US' returns 'en-US'.
 * @param langCode String containing language code to standardize.
 * @return Standardized language code.
 */
export function standardizeLanguageCode(langCode: string): LanguageCode {
    if (!isString(langCode) || langCode.length === 0) {
        throw new DeepLError('langCode must be a non-empty string');
    }
    const [lang, region] = langCode.split('-', 2);
    return (
        region === undefined ? lang.toLowerCase() : `${lang.toLowerCase()}-${region.toUpperCase()}`
    ) as LanguageCode;
}

/**
 * Removes the regional variant from a language, for example inputs 'en' and 'en-US' both return
 * 'en'.
 * @param langCode String containing language code to convert.
 * @return Language code with regional variant removed.
 */
export function nonRegionalLanguageCode(langCode: string): NonRegionalLanguageCode {
    if (!isString(langCode) || langCode.length === 0) {
        throw new DeepLError('langCode must be a non-empty string');
    }
    return langCode.split('-', 2)[0].toLowerCase() as NonRegionalLanguageCode;
}

/**
 * Joins given TagList with commas to form a single comma-delimited string.
 * @private
 */
function joinTagList(tagList: TagList): string {
    if (isString(tagList)) {
        return tagList;
    } else {
        return tagList.join(',');
    }
}

/**
 * Validates and prepares URLSearchParams for arguments common to text and document translation.
 * @private
 */
export function buildURLSearchParams(
    sourceLang: LanguageCode | null,
    targetLang: LanguageCode,
    formality: Formality | undefined,
    glossary: GlossaryId | GlossaryInfo | undefined,
    extraRequestParameters: RequestParameters | undefined,
): URLSearchParams {
    targetLang = standardizeLanguageCode(targetLang);
    if (sourceLang !== null) {
        sourceLang = standardizeLanguageCode(sourceLang);
    }

    if (glossary !== undefined && sourceLang === null) {
        throw new DeepLError('sourceLang is required if using a glossary');
    }

    if (glossary !== undefined && !isString(glossary)) {
        if (
            nonRegionalLanguageCode(targetLang) !== glossary.targetLang ||
            sourceLang !== glossary.sourceLang
        ) {
            throw new DeepLError('sourceLang and targetLang must match glossary');
        }
    }

    if (targetLang === 'en') {
        throw new DeepLError(
            "targetLang='en' is deprecated, please use 'en-GB' or 'en-US' instead.",
        );
    } else if (targetLang === 'pt') {
        throw new DeepLError(
            "targetLang='pt' is deprecated, please use 'pt-PT' or 'pt-BR' instead.",
        );
    }

    const searchParams = new URLSearchParams({
        target_lang: targetLang,
    });
    if (sourceLang !== null) {
        searchParams.append('source_lang', sourceLang);
    }
    if (formality !== undefined) {
        const formalityStr = String(formality).toLowerCase();
        searchParams.append('formality', formalityStr);
    }
    if (glossary !== undefined) {
        if (!isString(glossary)) {
            if (glossary.glossaryId === undefined) {
                throw new DeepLError(
                    'glossary option should be a string containing the Glossary ID or a GlossaryInfo object.',
                );
            }
            glossary = glossary.glossaryId;
        }
        searchParams.append('glossary_id', glossary);
    }
    if (extraRequestParameters !== undefined) {
        for (const paramName in extraRequestParameters) {
            searchParams.append(paramName, extraRequestParameters[paramName]);
        }
    }
    return searchParams;
}

/**
 * Validates and appends texts to HTTP request parameters, and returns whether a single text
 * argument was provided.
 * @param data Parameters for HTTP request.
 * @param texts User-supplied texts to be checked.
 * @return True if only a single text was provided.
 * @private
 */
export function appendTextsAndReturnIsSingular(
    data: URLSearchParams,
    texts: string | string[],
): boolean {
    const singular = !Array.isArray(texts);
    if (singular) {
        if (!isString(texts) || texts.length === 0) {
            throw new DeepLError(
                'texts parameter must be a non-empty string or array of non-empty strings',
            );
        }
        data.append('text', texts);
    } else {
        for (const text of texts) {
            if (!isString(text) || text.length === 0) {
                throw new DeepLError(
                    'texts parameter must be a non-empty string or array of non-empty strings',
                );
            }
            data.append('text', text);
        }
    }
    return singular;
}

/**
 * Validates and appends text options to HTTP request parameters.
 * @param data Parameters for HTTP request.
 * @param options Options for translate text request.
 * Note the formality and glossaryId options are handled separately, because these options
 * overlap with the translateDocument function.
 * @private
 */
export function validateAndAppendTextOptions(
    data: URLSearchParams,
    options?: TranslateTextOptions,
) {
    if (!options) {
        return;
    }
    if (options.splitSentences !== undefined) {
        options.splitSentences = options.splitSentences.toLowerCase() as SentenceSplittingMode;
        if (options.splitSentences === 'on' || options.splitSentences === 'default') {
            data.append('split_sentences', '1');
        } else if (options.splitSentences === 'off') {
            data.append('split_sentences', '0');
        } else {
            data.append('split_sentences', options.splitSentences);
        }
    }
    if (options.preserveFormatting !== undefined) {
        data.append('preserve_formatting', toBoolString(options.preserveFormatting));
    }
    if (options.tagHandling !== undefined) {
        data.append('tag_handling', options.tagHandling);
    }
    if (options.outlineDetection !== undefined) {
        data.append('outline_detection', toBoolString(options.outlineDetection));
    }
    if (options.context !== undefined) {
        data.append('context', options.context);
    }
    if (options.modelType !== undefined) {
        data.append('model_type', options.modelType);
    }
    if (options.nonSplittingTags !== undefined) {
        data.append('non_splitting_tags', joinTagList(options.nonSplittingTags));
    }
    if (options.splittingTags !== undefined) {
        data.append('splitting_tags', joinTagList(options.splittingTags));
    }
    if (options.ignoreTags !== undefined) {
        data.append('ignore_tags', joinTagList(options.ignoreTags));
    }
}
