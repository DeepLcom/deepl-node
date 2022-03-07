// Copyright 2022 DeepL SE (https://www.deepl.com)
// Use of this source code is governed by an MIT
// license that can be found in the LICENSE file.

import * as deepl from 'deepl-node';

import fs from 'fs';
import os from 'os';
import path from 'path';
import {v4 as randomUUID} from 'uuid';


// Note: this constant cannot be exported immediately, because exports are locally undefined
const _exampleText: Record<string, string> = {
    'bg': 'протонен лъч',
    'cs': 'protonový paprsek',
    'da': 'protonstråle',
    'de': 'Protonenstrahl',
    'el': 'δέσμη πρωτονίων',
    'en': 'proton beam',
    'en-US': 'proton beam',
    'en-GB': 'proton beam',
    'es': 'haz de protones',
    'et': 'prootonikiirgus',
    'fi': 'protonisäde',
    'fr': 'faisceau de protons',
    'hu': 'protonnyaláb',
    'it': 'fascio di protoni',
    'ja': '陽子ビーム',
    'lt': 'protonų spindulys',
    'lv': 'protonu staru kūlis',
    'nl': 'protonenbundel',
    'pl': 'wiązka protonów',
    'pt': 'feixe de prótons',
    'pt-BR': 'feixe de prótons',
    'pt-PT': 'feixe de prótons',
    'ro': 'fascicul de protoni',
    'ru': 'протонный луч',
    'sk': 'protónový lúč',
    'sl': 'protonski žarek',
    'sv': 'protonstråle',
    'zh': '质子束',
};

const usingMockServer = process.env.DEEPL_MOCK_SERVER_PORT !== undefined;

/**
 * Creates a random authKey for testing purposes. Only valid if using mock-server.
 */
function randomAuthKey(): string {
    if (!usingMockServer) throw new Error('A random authKey is only valid using mock-server.');
    return randomUUID();
}

function makeSessionName(): string {
    return `${expect.getState().currentTestName}/${randomUUID()}`;
}

export const exampleText = _exampleText;
export const exampleDocumentInput = _exampleText.en;
export const exampleDocumentOutput = _exampleText.de;
export const exampleLargeDocumentInput = (_exampleText.en + '\n').repeat(1000);
export const exampleLargeDocumentOutput = (_exampleText.de + '\n').repeat(1000);

/**
 * Creates temp directory, test files for a small and large .txt document, and an output path.
 */
export function tempFiles() {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'deepl-node-test-'));

    const exampleDocument = `${tempDir}/example_document.txt`;
    const exampleLargeDocument = `${tempDir}/example_large_document.txt`;
    const outputDocumentPath = `${tempDir}/output_document.txt`;

    fs.writeFileSync(exampleDocument, exampleDocumentInput);
    fs.writeFileSync(exampleLargeDocument, exampleLargeDocumentInput);

    return [exampleDocument, exampleLargeDocument, outputDocumentPath, tempDir];
}

export interface TestTranslatorOptions {
    authKey?: string;
    randomAuthKey?: boolean;
    maxRetries?: number;
    minTimeout?: number;

    mockServerNoResponseTimes?: number;
    mockServer429ResponseTimes?: number;
    mockServerInitCharacterLimit?: number;
    mockServerInitDocumentLimit?: number;
    mockServerInitTeamDocumentLimit?: number;
    mockServerDocFailureTimes?: number;
    mockServerDocQueueTime?: number;
    mockServerDocTranslateTime?: number;
    mockServerExpectProxy?: boolean;
    mockServerOptional?: boolean;
}

/**
 * Create a Translator object using given options for authKey, timeouts & retries, and mock-server
 * session settings.
 * @param options Options controlling Translator behaviour and mock-server sessions settings.
 */
export function makeTranslator(options?: TestTranslatorOptions) {
    if (!usingMockServer && process.env.DEEPL_AUTH_KEY === undefined) {
        throw Error('DEEPL_AUTH_KEY environment variable must be defined unless using mock-server');
    }

    const authKey = options?.authKey || (options?.randomAuthKey ? randomAuthKey() : process.env.DEEPL_AUTH_KEY || '');

    const serverUrl = process.env.DEEPL_SERVER_URL;

    const sessionHeaders: Record<string, string> = {};
    if (options?.mockServerNoResponseTimes !== undefined) sessionHeaders['mock-server-session-no-response-count'] = String(options?.mockServerNoResponseTimes);
    if (options?.mockServer429ResponseTimes !== undefined) sessionHeaders['mock-server-session-429-count'] = String(options?.mockServer429ResponseTimes);
    if (options?.mockServerInitCharacterLimit !== undefined) sessionHeaders['mock-server-session-init-character-limit'] = String(options?.mockServerInitCharacterLimit);
    if (options?.mockServerInitDocumentLimit !== undefined) sessionHeaders['mock-server-session-init-document-limit'] = String(options?.mockServerInitDocumentLimit);
    if (options?.mockServerInitTeamDocumentLimit !== undefined) sessionHeaders['mock-server-session-init-team-document-limit'] = String(options?.mockServerInitTeamDocumentLimit);
    if (options?.mockServerDocFailureTimes !== undefined) sessionHeaders['mock-server-session-doc-failure'] = String(options?.mockServerDocFailureTimes);
    if (options?.mockServerDocQueueTime !== undefined) sessionHeaders['mock-server-session-doc-queue-time'] = String(options?.mockServerDocQueueTime);
    if (options?.mockServerDocTranslateTime !== undefined) sessionHeaders['mock-server-session-doc-translate-time'] = String(options?.mockServerDocTranslateTime);
    if (options?.mockServerExpectProxy !== undefined) sessionHeaders['mock-server-session-expect-proxy'] = options?.mockServerExpectProxy ? '1' : '0';
    if (Object.entries(sessionHeaders).length !== 0) {
        if (!usingMockServer && !options?.mockServerOptional) throw new Error('Mock-server session is only used if using mock-server.');
        sessionHeaders['mock-server-session'] = makeSessionName();
    }

    return new deepl.Translator(authKey, {
        serverUrl: serverUrl,
        headers: sessionHeaders,
        minTimeout: options?.minTimeout,
        maxRetries: options?.maxRetries
    });
}

// Use instead of it(...) for tests that require a mock-server
export const withMockServer = usingMockServer ? it : it.skip;
// Use instead of it(...) for tests that cannot run using mock-server
export const withRealServer = usingMockServer ? it.skip : it;

// Wrap setTimeout() with Promise
export const timeout = (ms: number) => new Promise(res => setTimeout(res, ms));

module.exports = {
    exampleText,
    exampleDocumentInput,
    exampleDocumentOutput,
    exampleLargeDocumentInput,
    exampleLargeDocumentOutput,
    tempFiles,
    withMockServer,
    withRealServer,
    makeTranslator,
    timeout,
};


