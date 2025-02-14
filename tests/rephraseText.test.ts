// Copyright 2025 DeepL SE (https://www.deepl.com)
// Use of this source code is governed by an MIT
// license that can be found in the LICENSE file.

import { exampleText, makeDeeplClient, testTimeout, usingMockServer, withRealServer } from './core';

import { WritingStyle, WritingTone } from './../src/deeplClient';

describe('rephrase text', () => {
    it('should rephrase a single text', async () => {
        const deeplClient = makeDeeplClient();
        const result = await deeplClient.rephraseText(exampleText.de, 'de');
        expect(result.text).toBe(exampleText.de);
        expect(result.detectedSourceLang).toBe('de');
        expect(result.targetLang).toBe('de');
    });

    it('should throw an error for unsupported languages', async () => {
        const deeplClient = makeDeeplClient();
        const deeplClientPromise = deeplClient.rephraseText(exampleText.de, 'ja');
        await expect(deeplClientPromise).rejects.toBeInstanceOf(Error);
        await expect(deeplClientPromise).rejects.toThrow(/Value for '?target_lang'? not supported/);
    });

    it('should throw an error for unsupported tone', async () => {
        const deeplClient = makeDeeplClient();
        const deeplClientPromise = deeplClient.rephraseText(
            exampleText.de,
            'es',
            null,
            WritingTone.CONFIDENT,
        );
        await expect(deeplClientPromise).rejects.toBeInstanceOf(Error);
        await expect(deeplClientPromise).rejects.toThrow(
            /Language Spanish does not support setting a tone/,
        );
    });

    it('should throw an error for invalid writing_style parameter', async () => {
        const deeplClient = makeDeeplClient();
        const deeplClientPromise = deeplClient.rephraseText(
            exampleText.de,
            'es',
            WritingStyle.BUSINESS,
            null,
        );
        await expect(deeplClientPromise).rejects.toBeInstanceOf(Error);
        await expect(deeplClientPromise).rejects.toThrow(
            /Language Spanish does not support setting a writing style/,
        );
    });

    it('should throw an error if both style and tone are provided', async () => {
        const deeplClient = makeDeeplClient();
        const deeplClientPromise = deeplClient.rephraseText(
            exampleText.en,
            'en',
            WritingStyle.BUSINESS,
            WritingTone.CONFIDENT,
        );
        await expect(deeplClientPromise).rejects.toBeInstanceOf(Error);
        await expect(deeplClientPromise).rejects.toThrow(/Both writing_style and tone defined/);
    });

    it('should return success if style is default and tone is provided', async () => {
        const deeplClient = makeDeeplClient();
        const rephraseResponse = await deeplClient.rephraseText(
            exampleText.en,
            'en',
            WritingStyle.DEFAULT,
            WritingTone.CONFIDENT,
        );
        expect(rephraseResponse.text).toBeDefined();
        expect(rephraseResponse.detectedSourceLang).toBeDefined();
        expect(rephraseResponse.targetLang).toBe('en-US');
    });

    it('should return success if style is provided and tone is default', async () => {
        const deeplClient = makeDeeplClient();
        const rephraseResponse = await deeplClient.rephraseText(
            exampleText.de,
            'en',
            WritingStyle.ACADEMIC,
            WritingTone.DEFAULT,
        );
        expect(rephraseResponse.text).toBeDefined();
        expect(rephraseResponse.detectedSourceLang).toBeDefined();
        expect(rephraseResponse.targetLang).toBe('en-US');
    });

    it('should return success if both style and tone are not provided', async () => {
        const deeplClient = makeDeeplClient();
        const rephraseResponse = await deeplClient.rephraseText(
            exampleText.de,
            'en',
            null,
            undefined,
        );
        expect(rephraseResponse.text).toBeDefined();
        expect(rephraseResponse.detectedSourceLang).toBeDefined();
        expect(rephraseResponse.targetLang).toBe('en-US');
    });

    it(
        'should rephrase with style and tone',
        async () => {
            const deeplClient = makeDeeplClient();
            const input = 'How are yo dong guys?';

            const outputConfident = usingMockServer
                ? 'proton beam'
                : "Tell me how you're doing, guys.";
            expect(
                (await deeplClient.rephraseText(input, 'en', null, WritingTone.CONFIDENT)).text,
            ).toBe(outputConfident);

            const outputBusiness = usingMockServer
                ? 'proton beam'
                : 'Greetings, gentlemen. How are you?';
            expect(
                (await deeplClient.rephraseText(input, 'en', WritingStyle.BUSINESS, null)).text,
            ).toBe(outputBusiness);
        },
        testTimeout,
    );
});
