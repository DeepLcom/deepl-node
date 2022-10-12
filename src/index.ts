// Copyright 2022 DeepL SE (https://www.deepl.com)
// Use of this source code is governed by an MIT
// license that can be found in the LICENSE file.

import { HttpClient } from './client';
import {
    AuthorizationError,
    DeepLError,
    DocumentNotReadyError,
    DocumentTranslationError,
    GlossaryNotFoundError,
    QuotaExceededError,
    TooManyRequestsError,
} from './errors';
import { GlossaryEntries } from './glossaryEntries';
import {
    parseDocumentHandle,
    parseDocumentStatus,
    parseGlossaryInfo,
    parseGlossaryInfoList,
    parseGlossaryLanguagePairArray,
    parseLanguageArray,
    parseTextResultArray,
    parseUsage,
} from './parsing';
import {
    DocumentTranslateOptions,
    Formality,
    GlossaryId,
    GlossaryInfo,
    LanguageCode,
    NonRegionalLanguageCode,
    SentenceSplittingMode,
    SourceGlossaryLanguageCode,
    SourceLanguageCode,
    TagList,
    TargetGlossaryLanguageCode,
    TargetLanguageCode,
    TranslateTextOptions,
    TranslatorOptions,
} from './types';
import { isString, logInfo, streamToBuffer, streamToString, timeout } from './utils';

import * as fs from 'fs';
import { IncomingMessage, STATUS_CODES } from 'http';
import path from 'path';
import { URLSearchParams } from 'url';
import * as util from 'util';

export * from './errors';
export * from './glossaryEntries';
export * from './types';

/**
 * Stores the count and limit for one usage type.
 */
export interface UsageDetail {
    /** The amount used of this usage type. */
    readonly count: number;
    /** The maximum allowable amount for this usage type. */
    readonly limit: number;

    /**
     * Returns true if the amount used has already reached or passed the allowable amount.
     */
    limitReached(): boolean;
}

/**
 * Information about the API usage: how much has been translated in this billing period, and the
 * maximum allowable amount.
 *
 * Depending on the account type, different usage types are included: the character, document and
 * teamDocument fields provide details about each corresponding usage type, allowing each usage type
 * to be checked individually. The anyLimitReached() function checks if any usage type is exceeded.
 */
export interface Usage {
    /** Usage details for characters, for example due to the translateText() function. */
    readonly character?: UsageDetail;
    /** Usage details for documents. */
    readonly document?: UsageDetail;
    /** Usage details for documents shared among your team. */
    readonly teamDocument?: UsageDetail;

    /** Returns true if any usage type limit has been reached or passed, otherwise false. */
    anyLimitReached(): boolean;

    /** Converts the usage details to a human-readable string. */
    toString(): string;
}

/**
 * Information about a language supported by DeepL translator.
 */
export interface Language {
    /** Name of the language in English. */
    readonly name: string;
    /**
     * Language code according to ISO 639-1, for example 'en'. Some target languages also include
     * the regional variant according to ISO 3166-1, for example 'en-US'.
     */
    readonly code: LanguageCode;
    /**
     * Only defined for target languages. If defined, specifies whether the formality option is
     * available for this target language.
     */
    readonly supportsFormality?: boolean;
}

/**
 * Information about a pair of languages supported for DeepL glossaries.
 */
export interface GlossaryLanguagePair {
    /**
     * The code of the source language.
     */
    readonly sourceLang: SourceGlossaryLanguageCode;
    /**
     * The code of the target language.
     */
    readonly targetLang: TargetGlossaryLanguageCode;
}

/**
 * Handle to an in-progress document translation.
 */
export interface DocumentHandle {
    /**
     * ID of associated document request.
     */
    readonly documentId: string;

    /**
     * Key of associated document request.
     */
    readonly documentKey: string;
}

export type DocumentStatusCode = 'queued' | 'translating' | 'error' | 'done';

/**
 * Status of a document translation request.
 */
export interface DocumentStatus {
    /**
     * One of the status values defined in DocumentStatusCode.
     * @see DocumentStatusCode
     */
    readonly status: DocumentStatusCode;

    /**
     * Estimated time until document translation completes in seconds, otherwise undefined if
     * unknown.
     */
    readonly secondsRemaining?: number;

    /**
     * Number of characters billed for this document, or undefined if unknown or before translation
     * is complete.
     */
    readonly billedCharacters?: number;

    /**
     * A short description of the error, or undefined if no error has occurred.
     */
    readonly errorMessage?: string;

    /**
     * True if no error has occurred, otherwise false. Note that while the document translation is
     * in progress, this returns true.
     */
    ok(): boolean;

    /**
     * True if the document translation completed successfully, otherwise false.
     */
    done(): boolean;
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
 * Holds the result of a text translation request.
 */
export interface TextResult {
    /**
     * String containing the translated text.
     */
    readonly text: string;

    /**
     * Language code of the detected source language.
     */
    readonly detectedSourceLang: SourceLanguageCode;
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
function buildURLSearchParams(
    sourceLang: LanguageCode | null,
    targetLang: LanguageCode,
    formality: Formality | undefined,
    glossary: GlossaryId | GlossaryInfo | undefined,
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
        if (formalityStr !== 'default') {
            searchParams.append('formality', formalityStr);
        }
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
function appendTextsAndReturnIsSingular(data: URLSearchParams, texts: string | string[]): boolean {
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
                    'texts parameter must not be a non-empty string or array of non-empty strings',
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
function validateAndAppendTextOptions(data: URLSearchParams, options?: TranslateTextOptions) {
    if (!options) {
        return;
    }
    if (options.splitSentences) {
        options.splitSentences = options.splitSentences.toLowerCase() as SentenceSplittingMode;
        if (options.splitSentences === 'on' || options.splitSentences === 'default') {
            data.append('split_sentences', '1');
        } else if (options.splitSentences === 'off') {
            data.append('split_sentences', '0');
        } else {
            data.append('split_sentences', options.splitSentences);
        }
    }
    if (options.preserveFormatting) {
        data.append('preserve_formatting', '1');
    }
    if (options.tagHandling) {
        data.append('tag_handling', options.tagHandling);
    }
    if (options.outlineDetection === false) {
        data.append('outline_detection', '0');
    }
    if (options.nonSplittingTags) {
        data.append('non_splitting_tags', joinTagList(options.nonSplittingTags));
    }
    if (options.splittingTags) {
        data.append('splitting_tags', joinTagList(options.splittingTags));
    }
    if (options.ignoreTags) {
        data.append('ignore_tags', joinTagList(options.ignoreTags));
    }
}

/**
 * Checks the HTTP status code, and in case of failure, throws an exception with diagnostic information.
 * @private
 */
async function checkStatusCode(
    statusCode: number,
    content: string | IncomingMessage,
    usingGlossary = false,
    inDocumentDownload = false,
): Promise<void> {
    if (200 <= statusCode && statusCode < 400) return;

    if (content instanceof IncomingMessage) {
        try {
            content = await streamToString(content);
        } catch (e) {
            content = `Error occurred while reading response: ${e}`;
        }
    }

    let message = '';
    try {
        const jsonObj = JSON.parse(content);
        if (jsonObj.message !== undefined) {
            message += `, message: ${jsonObj.message}`;
        }
        if (jsonObj.detail !== undefined) {
            message += `, detail: ${jsonObj.detail}`;
        }
    } catch (error) {
        // JSON parsing errors are ignored, and we fall back to the raw content
        message = ', ' + content;
    }

    switch (statusCode) {
        case 403:
            throw new AuthorizationError(`Authorization failure, check auth_key${message}`);
        case 456:
            throw new QuotaExceededError(
                `Quota for this billing period has been exceeded${message}`,
            );
        case 404:
            if (usingGlossary) throw new GlossaryNotFoundError(`Glossary not found${message}`);
            throw new DeepLError(`Not found, check server_url${message}`);
        case 400:
            throw new DeepLError(`Bad request${message}`);
        case 429:
            throw new TooManyRequestsError(
                `Too many requests, DeepL servers are currently experiencing high load${message}`,
            );
        case 503:
            if (inDocumentDownload) {
                throw new DocumentNotReadyError(`Document not ready${message}`);
            } else {
                throw new DeepLError(`Service unavailable${message}`);
            }
        default: {
            const statusName = STATUS_CODES[statusCode] || 'Unknown';
            throw new DeepLError(
                `Unexpected status code: ${statusCode} ${statusName}${message}, content: ${content}`,
            );
        }
    }
}

/**
 * Wrapper for the DeepL API for language translation.
 * Create an instance of Translator to use the DeepL API.
 */
export class Translator {
    /**
     * Construct a Translator object wrapping the DeepL API using your authentication key.
     * This does not connect to the API, and returns immediately.
     * @param authKey Authentication key as specified in your account.
     * @param options Additional options controlling Translator behavior.
     */
    constructor(authKey: string, options?: TranslatorOptions) {
        if (!isString(authKey) || authKey.length === 0) {
            throw new DeepLError('authKey must be a non-empty string');
        }

        let serverUrl;
        if (options?.serverUrl !== undefined) {
            serverUrl = options.serverUrl;
        } else if (isFreeAccountAuthKey(authKey)) {
            serverUrl = 'https://api-free.deepl.com';
        } else {
            serverUrl = 'https://api.deepl.com';
        }
        const headers = {
            Authorization: `DeepL-Auth-Key ${authKey}`,
            'User-Agent': 'deepl-node/1.7.0',
            ...(options?.headers ?? {}),
        };

        const maxRetries = options?.maxRetries !== undefined ? options.maxRetries : 5;
        const minTimeout = options?.minTimeout !== undefined ? options.minTimeout : 5000;
        this.httpClient = new HttpClient(
            serverUrl,
            headers,
            maxRetries,
            minTimeout,
            options?.proxy,
        );
    }

    /**
     * Queries character and document usage during the current billing period.
     * @return Fulfills with Usage object on success.
     */
    public async getUsage(): Promise<Usage> {
        const { statusCode, content } = await this.httpClient.sendRequestWithBackoff<string>(
            'POST',
            '/v2/usage',
        );
        await checkStatusCode(statusCode, content);
        return parseUsage(content);
    }

    /**
     * Queries source languages supported by DeepL API.
     * @return Fulfills with array of Language objects containing available source languages.
     */
    async getSourceLanguages(): Promise<readonly Language[]> {
        const { statusCode, content } = await this.httpClient.sendRequestWithBackoff<string>(
            'GET',
            '/v2/languages',
        );
        await checkStatusCode(statusCode, content);
        return parseLanguageArray(content);
    }

    /**
     * Queries target languages supported by DeepL API.
     * @return Fulfills with array of Language objects containing available target languages.
     */
    async getTargetLanguages(): Promise<readonly Language[]> {
        const data = new URLSearchParams({ type: 'target' });
        const { statusCode, content } = await this.httpClient.sendRequestWithBackoff<string>(
            'GET',
            '/v2/languages',
            {
                data,
            },
        );
        await checkStatusCode(statusCode, content);
        return parseLanguageArray(content);
    }

    /**
     * Queries language pairs supported for glossaries by DeepL API.
     * @return Fulfills with an array of GlossaryLanguagePair objects containing languages supported for glossaries.
     */
    async getGlossaryLanguagePairs(): Promise<readonly GlossaryLanguagePair[]> {
        const { statusCode, content } = await this.httpClient.sendRequestWithBackoff<string>(
            'GET',
            '/v2/glossary-language-pairs',
        );
        await checkStatusCode(statusCode, content);
        return parseGlossaryLanguagePairArray(content);
    }

    /**
     * Translates specified text string or array of text strings into the target language.
     * @param texts Text string or array of strings containing input text(s) to translate.
     * @param sourceLang Language code of input text language, or null to use auto-detection.
     * @param targetLang Language code of language to translate into.
     * @param options Optional TranslateTextOptions object containing additional options controlling translation.
     * @return Fulfills with a TextResult object or an array of TextResult objects corresponding to input texts; use the `TextResult.text` property to access the translated text.
     */
    async translateText<T extends string | string[]>(
        texts: T,
        sourceLang: SourceLanguageCode | null,
        targetLang: TargetLanguageCode,
        options?: TranslateTextOptions,
    ): Promise<T extends string ? TextResult : TextResult[]> {
        const data = buildURLSearchParams(
            sourceLang,
            targetLang,
            options?.formality,
            options?.glossary,
        );
        const singular = appendTextsAndReturnIsSingular(data, texts);
        validateAndAppendTextOptions(data, options);

        const { statusCode, content } = await this.httpClient.sendRequestWithBackoff<string>(
            'POST',
            '/v2/translate',
            { data },
        );
        await checkStatusCode(statusCode, content);
        const textResults = parseTextResultArray(content);
        return (singular ? textResults[0] : textResults) as T extends string
            ? TextResult
            : TextResult[];
    }

    /**
     * Uploads specified document to DeepL to translate into given target language, waits for
     * translation to complete, then downloads translated document to specified output path.
     * @param inputFile String containing file path of document to be translated, or a Stream,
     *     Buffer, or FileHandle containing file data. Note: unless file path is used, then
     *     `options.filename` must be specified.
     * @param outputFile String containing file path to create translated document, or Stream or
     *     FileHandle to write translated document content.
     * @param sourceLang Language code of input document, or null to use auto-detection.
     * @param targetLang Language code of language to translate into.
     * @param options Optional DocumentTranslateOptions object containing additional options controlling translation.
     * @return Fulfills with a DocumentStatus object for the completed translation. You can use the
     *     billedCharacters property to check how many characters were billed for the document.
     * @throws {Error} If no file exists at the input file path, or a file already exists at the output file path.
     * @throws {DocumentTranslationError} If any error occurs during document upload, translation or
     *     download. The `documentHandle` property of the error may be used to recover the document.
     */
    async translateDocument(
        inputFile: string | Buffer | fs.ReadStream | fs.promises.FileHandle,
        outputFile: string | fs.WriteStream | fs.promises.FileHandle,
        sourceLang: SourceLanguageCode | null,
        targetLang: TargetLanguageCode,
        options?: DocumentTranslateOptions,
    ): Promise<DocumentStatus> {
        // Helper function to open output file if provided as filepath and remove it on error
        async function getOutputHandleAndOnError(): Promise<{
            outputHandle: fs.WriteStream | fs.promises.FileHandle;
            onError?: () => Promise<void>;
        }> {
            if (isString(outputFile)) {
                // Open output file path, fail if file already exists
                const outputHandle = await fs.promises.open(outputFile, 'wx');
                // Set up error handler to remove created file
                const onError = async () => {
                    try {
                        // remove created output file
                        await outputHandle.close();
                        await util.promisify(fs.unlink)(outputFile);
                    } catch {
                        // Ignore errors
                    }
                };
                return { outputHandle, onError };
            }
            return { outputHandle: outputFile };
        }

        const { outputHandle, onError } = await getOutputHandleAndOnError();

        let documentHandle = undefined;
        try {
            documentHandle = await this.uploadDocument(inputFile, sourceLang, targetLang, options);
            const { status } = await this.isDocumentTranslationComplete(documentHandle);
            await this.downloadDocument(documentHandle, outputHandle);
            return status;
        } catch (errorUnknown: unknown) {
            if (onError) await onError();
            const error = errorUnknown instanceof Error ? errorUnknown : undefined;
            const message =
                'Error occurred while translating document: ' +
                (error?.message ? error?.message : errorUnknown);
            throw new DocumentTranslationError(message, documentHandle, error);
        }
    }

    /**
     * Uploads specified document to DeepL to translate into target language, and returns handle associated with the document.
     * @param inputFile String containing file path, stream containing file data, or FileHandle.
     *     Note: if a Buffer, Stream, or FileHandle is used, then `options.filename` must be specified.
     * @param sourceLang Language code of input document, or null to use auto-detection.
     * @param targetLang Language code of language to translate into.
     * @param options Optional DocumentTranslateOptions object containing additional options controlling translation.
     * @return Fulfills with DocumentHandle associated with the in-progress translation.
     */
    async uploadDocument(
        inputFile: string | Buffer | fs.ReadStream | fs.promises.FileHandle,
        sourceLang: SourceLanguageCode | null,
        targetLang: TargetLanguageCode,
        options?: DocumentTranslateOptions,
    ): Promise<DocumentHandle> {
        if (isString(inputFile)) {
            const buffer = await fs.promises.readFile(inputFile);
            return this.internalUploadDocument(
                buffer,
                sourceLang,
                targetLang,
                path.basename(inputFile),
                options,
            );
        } else {
            if (options?.filename === undefined) {
                throw new DeepLError(
                    'options.filename must be specified unless using input file path',
                );
            }

            if (inputFile instanceof fs.ReadStream) {
                const buffer = await streamToBuffer(inputFile);
                return this.internalUploadDocument(
                    buffer,
                    sourceLang,
                    targetLang,
                    options.filename,
                    options,
                );
            } else if (inputFile instanceof Buffer) {
                return this.internalUploadDocument(
                    inputFile,
                    sourceLang,
                    targetLang,
                    options.filename,
                    options,
                );
            } else {
                // FileHandle
                const buffer = await inputFile.readFile();
                const handle = await this.internalUploadDocument(
                    buffer,
                    sourceLang,
                    targetLang,
                    options.filename,
                    options,
                );
                await inputFile.close();
                return handle;
            }
        }
    }

    /**
     * Retrieves the status of the document translation associated with the given document handle.
     * @param handle Document handle associated with document.
     * @return Fulfills with a DocumentStatus giving the document translation status.
     */
    async getDocumentStatus(handle: DocumentHandle): Promise<DocumentStatus> {
        const data = new URLSearchParams({ document_key: handle.documentKey });
        const { statusCode, content } = await this.httpClient.sendRequestWithBackoff<string>(
            'POST',
            `/v2/document/${handle.documentId}`,
            { data },
        );
        await checkStatusCode(statusCode, content, false, true);
        return parseDocumentStatus(content);
    }

    /**
     * Downloads the translated document associated with the given document handle to the specified output file path or stream.handle.
     * @param handle Document handle associated with document.
     * @param outputFile String containing output file path, or Stream or FileHandle to store file data.
     * @return Fulfills with undefined, or rejects if the document translation has not been completed.
     */
    async downloadDocument(
        handle: DocumentHandle,
        outputFile: string | fs.WriteStream | fs.promises.FileHandle,
    ): Promise<void> {
        if (isString(outputFile)) {
            const fileStream = await fs.createWriteStream(outputFile, { flags: 'wx' });
            try {
                await this.internalDownloadDocument(handle, fileStream);
            } catch (e) {
                await new Promise((resolve) => fileStream.close(resolve));
                await fs.promises.unlink(outputFile);
                throw e;
            }
        } else if (outputFile instanceof fs.WriteStream) {
            return this.internalDownloadDocument(handle, outputFile);
        } else {
            // FileHandle
            const dummyFilePath = '';
            const outputStream = fs.createWriteStream(dummyFilePath, { fd: outputFile.fd });
            await this.internalDownloadDocument(handle, outputStream);
            try {
                await outputFile.close();
            } catch {
                // Ignore errors
            }
        }
    }

    /**
     * Returns a promise that resolves when the given document translation completes, or rejects if
     * there was an error communicating with the DeepL API or the document translation failed.
     * @param handle {DocumentHandle} Handle to the document translation.
     * @return Fulfills with input DocumentHandle and DocumentStatus when the document translation
     * completes successfully, rejects if translation fails or a communication error occurs.
     */
    async isDocumentTranslationComplete(
        handle: DocumentHandle,
    ): Promise<{ handle: DocumentHandle; status: DocumentStatus }> {
        let status = await this.getDocumentStatus(handle);
        while (!status.done() && status.ok()) {
            // Wait for half of remaining time, limited between 1 and 60 seconds
            let secs = (status.secondsRemaining || 0) / 2.0 + 1.0;
            secs = Math.max(1.0, Math.min(secs, 60.0));
            await timeout(secs * 1000);
            logInfo(`Rechecking document translation status after sleeping for ${secs} seconds.`);
            status = await this.getDocumentStatus(handle);
        }
        if (!status.ok()) {
            const message = status.errorMessage || 'unknown error';
            throw new DeepLError(message);
        }
        return { handle, status };
    }

    /**
     * Creates a new glossary on the DeepL server with given name, languages, and entries.
     * @param name User-defined name to assign to the glossary.
     * @param sourceLang Language code of the glossary source terms.
     * @param targetLang Language code of the glossary target terms.
     * @param entries The source- & target-term pairs to add to the glossary.
     * @return Fulfills with a GlossaryInfo containing details about the created glossary.
     */
    async createGlossary(
        name: string,
        sourceLang: LanguageCode,
        targetLang: LanguageCode,
        entries: GlossaryEntries,
    ): Promise<GlossaryInfo> {
        if (Object.keys(entries.entries()).length === 0) {
            throw new DeepLError('glossary entries must not be empty');
        }

        const tsv = entries.toTsv();
        return this.internalCreateGlossary(name, sourceLang, targetLang, 'tsv', tsv);
    }

    /**
     * Creates a new glossary on DeepL server with given name, languages, and CSV data.
     * @param name User-defined name to assign to the glossary.
     * @param sourceLang Language code of the glossary source terms.
     * @param targetLang Language code of the glossary target terms.
     * @param csvFile String containing the path of the CSV file to be translated, or a Stream,
     *     Buffer, or a FileHandle containing CSV file content.
     * @return Fulfills with a GlossaryInfo containing details about the created glossary.
     */
    async createGlossaryWithCsv(
        name: string,
        sourceLang: LanguageCode,
        targetLang: LanguageCode,
        csvFile: string | Buffer | fs.ReadStream | fs.promises.FileHandle,
    ): Promise<GlossaryInfo> {
        let csvContent;
        if (isString(csvFile)) {
            csvContent = (await fs.promises.readFile(csvFile)).toString();
        } else if (csvFile instanceof fs.ReadStream) {
            csvContent = (await streamToBuffer(csvFile)).toString();
        } else if (csvFile instanceof Buffer) {
            csvContent = csvFile.toString();
        } else {
            // FileHandle
            csvContent = (await csvFile.readFile()).toString();
            await csvFile.close();
        }

        return this.internalCreateGlossary(name, sourceLang, targetLang, 'csv', csvContent);
    }

    /**
     * Gets information about an existing glossary.
     * @param glossaryId Glossary ID of the glossary.
     * @return Fulfills with a GlossaryInfo containing details about the glossary.
     */
    async getGlossary(glossaryId: GlossaryId): Promise<GlossaryInfo> {
        const { statusCode, content } = await this.httpClient.sendRequestWithBackoff<string>(
            'GET',
            `/v2/glossaries/${glossaryId}`,
        );
        await checkStatusCode(statusCode, content, true);
        return parseGlossaryInfo(content);
    }

    /**
     * Gets information about all existing glossaries.
     * @return Fulfills with an array of GlossaryInfos containing details about all existing glossaries.
     */
    async listGlossaries(): Promise<GlossaryInfo[]> {
        const { statusCode, content } = await this.httpClient.sendRequestWithBackoff<string>(
            'GET',
            '/v2/glossaries',
        );
        await checkStatusCode(statusCode, content, true);
        return parseGlossaryInfoList(content);
    }

    /**
     * Retrieves the entries stored with the glossary with the given glossary ID or GlossaryInfo.
     * @param glossary Glossary ID or GlossaryInfo of glossary to retrieve entries of.
     * @return Fulfills with GlossaryEntries holding the glossary entries.
     */
    async getGlossaryEntries(glossary: GlossaryId | GlossaryInfo): Promise<GlossaryEntries> {
        glossary = isString(glossary) ? glossary : glossary.glossaryId;

        const { statusCode, content } = await this.httpClient.sendRequestWithBackoff<string>(
            'GET',
            `/v2/glossaries/${glossary}/entries`,
        );
        await checkStatusCode(statusCode, content, true);
        return new GlossaryEntries({ tsv: content });
    }

    /**
     * Deletes the glossary with the given glossary ID or GlossaryInfo.
     * @param glossary Glossary ID or GlossaryInfo of glossary to be deleted.
     * @return Fulfills with undefined when the glossary is deleted.
     */
    async deleteGlossary(glossary: GlossaryId | GlossaryInfo): Promise<void> {
        glossary = isString(glossary) ? glossary : glossary.glossaryId;
        const { statusCode, content } = await this.httpClient.sendRequestWithBackoff<string>(
            'DELETE',
            `/v2/glossaries/${glossary}`,
        );
        await checkStatusCode(statusCode, content, true);
    }

    /**
     * Upload given stream for document translation and returns document handle.
     * @private
     */
    private async internalUploadDocument(
        fileBuffer: Buffer,
        sourceLang: SourceLanguageCode | null,
        targetLang: TargetLanguageCode,
        filename: string,
        options?: DocumentTranslateOptions,
    ): Promise<DocumentHandle> {
        const data = buildURLSearchParams(
            sourceLang,
            targetLang,
            options?.formality,
            options?.glossary,
        );
        const { statusCode, content } = await this.httpClient.sendRequestWithBackoff<string>(
            'POST',
            '/v2/document',
            {
                data,
                fileBuffer,
                filename,
            },
        );
        await checkStatusCode(statusCode, content);
        return parseDocumentHandle(content);
    }

    /**
     * Download translated document associated with specified handle to given stream.
     * @private
     */
    private async internalDownloadDocument(
        handle: DocumentHandle,
        outputStream: fs.WriteStream,
    ): Promise<void> {
        const data = new URLSearchParams({ document_key: handle.documentKey });
        const { statusCode, content } =
            await this.httpClient.sendRequestWithBackoff<IncomingMessage>(
                'POST',
                `/v2/document/${handle.documentId}/result`,
                { data },
                true,
            );
        await checkStatusCode(statusCode, content, false, true);

        content.pipe(outputStream);
        return new Promise((resolve, reject) => {
            outputStream.on('finish', resolve);
            outputStream.on('error', reject);
        });
    }

    /**
     * Create glossary with given details.
     * @private
     */
    private async internalCreateGlossary(
        name: string,
        sourceLang: LanguageCode,
        targetLang: LanguageCode,
        entriesFormat: string,
        entries: string,
    ): Promise<GlossaryInfo> {
        // Glossaries are only supported for base language types
        sourceLang = nonRegionalLanguageCode(sourceLang);
        targetLang = nonRegionalLanguageCode(targetLang);

        if (!isString(name) || name.length === 0) {
            throw new DeepLError('glossary name must be a non-empty string');
        }

        const data = new URLSearchParams({
            name: name,
            source_lang: sourceLang,
            target_lang: targetLang,
            entries_format: entriesFormat,
            entries: entries,
        });

        const { statusCode, content } = await this.httpClient.sendRequestWithBackoff<string>(
            'POST',
            '/v2/glossaries',
            { data },
        );
        await checkStatusCode(statusCode, content, true);
        return parseGlossaryInfo(content);
    }

    /**
     * HttpClient implements all HTTP requests and retries.
     * @private
     */
    private readonly httpClient: HttpClient;
}
