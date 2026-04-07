// Copyright 2025 DeepL SE (https://www.deepl.com)
// Use of this source code is governed by an MIT
// license that can be found in the LICENSE file.
import { makeDeeplClient, withMockServer } from './core';

describe('Translation Memories Tests', () => {
    const DEFAULT_TM_ID = 'a74d88fb-ed2a-4943-a664-a4512398b994';

    withMockServer('test listTranslationMemories', async () => {
        const deeplClient = makeDeeplClient();
        const translationMemories = await deeplClient.listTranslationMemories(0, 10);

        expect(Array.isArray(translationMemories)).toBe(true);
        expect(translationMemories.length).toBeGreaterThan(0);
        expect(translationMemories[0].translationMemoryId).toBeDefined();
        expect(translationMemories[0].name).toBeDefined();
        expect(translationMemories[0].sourceLanguage).toBeDefined();
        expect(translationMemories[0].targetLanguages).toBeDefined();
        expect(translationMemories[0].segmentCount).toBeDefined();
    });

    withMockServer('test translateText with translationMemory string ID', async () => {
        const deeplClient = makeDeeplClient();
        const exampleText = 'Hallo, Welt!';
        await deeplClient.translateText(exampleText, 'de', 'en-US', {
            translationMemory: DEFAULT_TM_ID,
        });
    });

    withMockServer('test translateText with translationMemory and threshold', async () => {
        const deeplClient = makeDeeplClient();
        const exampleText = 'Hallo, Welt!';
        await deeplClient.translateText(exampleText, 'de', 'en-US', {
            translationMemory: DEFAULT_TM_ID,
            translationMemoryThreshold: 80,
        });
    });
});
