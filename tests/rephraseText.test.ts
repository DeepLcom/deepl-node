// Copyright 2025 DeepL SE (https://www.deepl.com)
// Use of this source code is governed by an MIT
// license that can be found in the LICENSE file.

import { exampleText, makeDeeplClient, testTimeout, withRealServer } from './core';

import { WritingTone, WritingStyle } from './../src/deeplClient';

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
        await expect(deeplClientPromise).rejects.toThrow(/Value for 'target_lang' not supported/);
    });

    withRealServer(
        'should rephrase with style and tone',
        async () => {
            const deeplClient = makeDeeplClient();
            const input = 'How are yo dong guys?';

            const outputConfident = "Tell me how you're doing, guys.";
            expect(
                (await deeplClient.rephraseText(input, 'en', null, WritingTone.CONFIDENT)).text,
            ).toBe(outputConfident);

            const outputBusiness = 'Greetings, gentlemen. How are you?';
            expect(
                (await deeplClient.rephraseText(input, 'en', WritingStyle.BUSINESS, null)).text,
            ).toBe(outputBusiness);

            const deeplClientPromise = deeplClient.rephraseText(
                input,
                'en',
                WritingStyle.BUSINESS,
                WritingTone.CONFIDENT,
            );
            await expect(deeplClientPromise).rejects.toBeInstanceOf(Error);
            await expect(deeplClientPromise).rejects.toThrow(/Both writing_style and tone defined/);
        },
        testTimeout,
    );
});
