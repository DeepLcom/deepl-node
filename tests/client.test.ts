// Copyright 2025 DeepL SE (https://www.deepl.com)
// Use of this source code is governed by an MIT
// license that can be found in the LICENSE file.

import * as deepl from 'deepl-node';

import { exampleText, makeDeeplClient, makeTranslator } from './core';
import { RETRYABLE_AXIOS_ERROR_CODES } from '../src/client';
import log from 'loglevel';

jest.mock('loglevel', () => ({
    debug: jest.fn(),
    getLogger: jest.fn().mockReturnValue({
        setLevel: jest.fn(),
        debug: jest.fn(),
        info: jest.fn(),
    }),
}));

describe('client tests', () => {
    describe('retry classification', () => {
        it.each([
            ['ETIMEDOUT'],
            ['ECONNABORTED'],
            ['ECONNRESET'],
            ['EPIPE'],
            ['EAI_AGAIN'],
        ])('treats axios error code %s as retryable', (code) => {
            expect(RETRYABLE_AXIOS_ERROR_CODES.has(code)).toBe(true);
        });

        it.each([
            ['ENOTFOUND'],
            ['ECONNREFUSED'],
            ['CERT_HAS_EXPIRED'],
        ])('does not treat axios error code %s as retryable', (code) => {
            expect(RETRYABLE_AXIOS_ERROR_CODES.has(code)).toBe(false);
        });
    });

    describe('log debug', () => {
        beforeEach(() => {
            jest.clearAllMocks();
            log.getLogger('deepl').setLevel('debug');
        });

        it('with translate text', async () => {
            const translator = makeTranslator({});
            const result = await translator.translateText(exampleText.en, null, 'de');

            expect(log.getLogger('deepl').debug).toHaveBeenCalledTimes(3);
            expect(log.getLogger('deepl').debug).toHaveBeenNthCalledWith(
                1,
                expect.stringContaining('Request details:'),
            );
            expect(log.getLogger('deepl').debug).toHaveBeenNthCalledWith(
                2,
                expect.stringContaining('Trace details:, xTraceId = '),
            );
            expect(log.getLogger('deepl').debug).toHaveBeenNthCalledWith(
                3,
                expect.stringContaining('Response details:, content = '),
            );
        });

        it('with rephrase text', async () => {
            const deeplClient = makeDeeplClient({});
            const result = await deeplClient.rephraseText(exampleText.de, 'de');

            expect(log.getLogger('deepl').debug).toHaveBeenCalledTimes(3);
            expect(log.getLogger('deepl').debug).toHaveBeenNthCalledWith(
                1,
                expect.stringContaining('Request details:'),
            );
            expect(log.getLogger('deepl').debug).toHaveBeenNthCalledWith(
                2,
                expect.stringContaining('Trace details:, xTraceId = '),
            );
            expect(log.getLogger('deepl').debug).toHaveBeenNthCalledWith(
                3,
                expect.stringContaining('Response details:, content = '),
            );
        });
    });
});
