// Copyright 2025 DeepL SE (https://www.deepl.com)
// Use of this source code is governed by an MIT
// license that can be found in the LICENSE file.
import { makeDeeplClient, withMockServer } from './core';

describe('Style Rules Tests', () => {
    const DEFAULT_STYLE_ID = 'dca2e053-8ae5-45e6-a0d2-881156e7f4e4';

    withMockServer('test getAllStyleRules', async () => {
        const deeplClient = makeDeeplClient();
        const styleRules = await deeplClient.getAllStyleRules(0, 10, true);

        expect(Array.isArray(styleRules)).toBe(true);
        expect(styleRules.length).toBeGreaterThan(0);
        expect(styleRules[0].styleId).toBe(DEFAULT_STYLE_ID);
        expect(styleRules[0].configuredRules).toBeDefined();
        expect(styleRules[0].customInstructions).toBeDefined();
    });

    withMockServer('test getAllStyleRules without detailed', async () => {
        const deeplClient = makeDeeplClient();
        const styleRules = await deeplClient.getAllStyleRules();

        expect(Array.isArray(styleRules)).toBe(true);
        expect(styleRules.length).toBeGreaterThan(0);
        expect(styleRules[0].styleId).toBe(DEFAULT_STYLE_ID);
        expect(styleRules[0].configuredRules).toBeUndefined();
        expect(styleRules[0].customInstructions).toBeUndefined();
    });

    withMockServer('test translateText with styleRule', async () => {
        // Note: this test may use the mock server that will not translate the text
        // with a style rule, therefore we do not check the translated result.
        const deeplClient = makeDeeplClient();
        const exampleText = 'Hallo, Welt!';
        await deeplClient.translateText(exampleText, 'de', 'en-US', {
            styleRule: DEFAULT_STYLE_ID,
        });
    });

    withMockServer('test translateText with StyleRuleInfo object', async () => {
        const deeplClient = makeDeeplClient();
        const styleRules = await deeplClient.getAllStyleRules();
        const styleRule = styleRules[0];
        const exampleText = 'Hallo, Welt!';
        await deeplClient.translateText(exampleText, 'de', 'en-US', {
            styleRule: styleRule,
        });
    });
});
