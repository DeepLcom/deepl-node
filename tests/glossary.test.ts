// Copyright 2022 DeepL SE (https://www.deepl.com)
// Use of this source code is governed by an MIT
// license that can be found in the LICENSE file.

import * as deepl from 'deepl-node';

import fs from 'fs';
import { makeTranslator, tempFiles, withRealServer } from './core';
import { v4 as randomUUID } from 'uuid';

const invalidGlossaryId = 'invalid_glossary_id';
const nonExistentGlossaryId = '96ab91fd-e715-41a1-adeb-5d701f84a483';

function getGlossaryName(): string {
    return `deepl-node-test-glossary: ${expect.getState().currentTestName} ${randomUUID()}`;
}

interface CreateManagedGlossaryArgs {
    name?: string;
    sourceLang: deepl.LanguageCode;
    targetLang: deepl.LanguageCode;
    entries: deepl.GlossaryEntries;
    glossaryNameSuffix?: string;
}

async function createManagedGlossary(
    translator: deepl.Translator,
    args: CreateManagedGlossaryArgs,
): Promise<[deepl.GlossaryInfo, () => void]> {
    args.glossaryNameSuffix = args?.glossaryNameSuffix || '';
    args.name = args?.name || getGlossaryName() + args.glossaryNameSuffix;
    const glossary = await translator.createGlossary(
        args.name,
        args.sourceLang,
        args.targetLang,
        args.entries,
    );

    const cleanupGlossary = async () => {
        try {
            await translator.deleteGlossary(glossary);
        } catch (e) {
            // Suppress errors
        }
    };

    return [glossary, cleanupGlossary];
}

describe('translate using glossaries', () => {
    it('should create glossaries', async () => {
        const translator = makeTranslator();
        const glossaryName = getGlossaryName();
        const sourceLang = 'en';
        const targetLang = 'de';
        const entries = new deepl.GlossaryEntries({ entries: { Hello: 'Hallo' } });
        const [glossary, cleanupGlossary] = await createManagedGlossary(translator, {
            name: glossaryName,
            sourceLang,
            targetLang,
            entries,
        });
        try {
            expect(glossary.name).toBe(glossaryName);
            expect(glossary.sourceLang).toBe(sourceLang);
            expect(glossary.targetLang).toBe(targetLang);
            // Note: ready field is indeterminate
            // Note: creationTime according to server might differ from local clock
            expect(glossary.entryCount).toBe(Object.keys(entries).length);

            const getResult = await translator.getGlossary(glossary.glossaryId);
            expect(getResult.glossaryId).toBe(glossary.glossaryId);
            expect(getResult.name).toBe(glossary.name);
            expect(getResult.sourceLang).toBe(glossary.sourceLang);
            expect(getResult.targetLang).toBe(glossary.targetLang);
            expect(getResult.creationTime.getTime()).toBe(glossary.creationTime.getTime());
            expect(getResult.entryCount).toBe(glossary.entryCount);
        } finally {
            await cleanupGlossary();
        }
    });

    it('should reject creating invalid glossaries', async () => {
        const translator = makeTranslator();
        const glossaryName = getGlossaryName();
        const entries = new deepl.GlossaryEntries({ entries: { Hello: 'Hallo' } });
        try {
            await expect(translator.createGlossary('', 'en', 'de', entries)).rejects.toThrowError(
                deepl.DeepLError,
            );
            await expect(
                translator.createGlossary(glossaryName, 'en', 'ja', entries),
            ).rejects.toThrowError(deepl.DeepLError);
            await expect(
                translator.createGlossary(glossaryName, 'ja', 'de', entries),
            ).rejects.toThrowError(deepl.DeepLError);
            const targetLangXX = <deepl.TargetLanguageCode>'xx'; // Type cast to silence type-checks
            await expect(
                translator.createGlossary(glossaryName, 'en', targetLangXX, entries),
            ).rejects.toThrowError(deepl.DeepLError);
        } finally {
            const glossaries = await translator.listGlossaries();
            for (const glossaryKey in glossaries) {
                const glossaryInfo = glossaries[glossaryKey];
                if (glossaryInfo.name === glossaryName) {
                    await translator.deleteGlossary(glossaryInfo);
                }
            }
        }
    });

    it('should get glossaries', async () => {
        const translator = makeTranslator();
        const sourceLang = 'en';
        const targetLang = 'de';
        const entries = new deepl.GlossaryEntries({ entries: { Hello: 'Hallo' } });
        const [createdGlossary, cleanupGlossary] = await createManagedGlossary(translator, {
            sourceLang,
            targetLang,
            entries,
        });
        try {
            const glossary = await translator.getGlossary(createdGlossary.glossaryId);
            expect(glossary.glossaryId).toBe(createdGlossary.glossaryId);
            expect(glossary.name).toBe(createdGlossary.name);
            expect(glossary.sourceLang).toBe(createdGlossary.sourceLang);
            expect(glossary.targetLang).toBe(createdGlossary.targetLang);
            expect(glossary.entryCount).toBe(createdGlossary.entryCount);
        } finally {
            await cleanupGlossary();
        }

        await expect(translator.getGlossary(invalidGlossaryId)).rejects.toThrowError(
            deepl.DeepLError,
        );
        await expect(translator.getGlossary(nonExistentGlossaryId)).rejects.toThrowError(
            deepl.GlossaryNotFoundError,
        );
    });

    it('should get glossary entries', async () => {
        const translator = makeTranslator();
        const entries = new deepl.GlossaryEntries({
            entries: {
                Apple: 'Apfel',
                Banana: 'Banane',
            },
        });
        const [createdGlossary, cleanupGlossary] = await createManagedGlossary(translator, {
            sourceLang: 'en',
            targetLang: 'de',
            entries,
        });
        try {
            expect((await translator.getGlossaryEntries(createdGlossary)).entries()).toStrictEqual(
                entries.entries(),
            );
            expect(await translator.getGlossaryEntries(createdGlossary.glossaryId)).toStrictEqual(
                entries,
            );
        } finally {
            await cleanupGlossary();
        }

        await expect(translator.getGlossaryEntries(invalidGlossaryId)).rejects.toThrowError(
            deepl.DeepLError,
        );
        await expect(translator.getGlossaryEntries(nonExistentGlossaryId)).rejects.toThrowError(
            deepl.GlossaryNotFoundError,
        );
    });

    it('should list glossaries', async () => {
        const translator = makeTranslator();
        const [createdGlossary, cleanupGlossary] = await createManagedGlossary(translator, {
            sourceLang: 'en',
            targetLang: 'de',
            entries: new deepl.GlossaryEntries({ entries: { Hello: 'Hallo' } }),
        });
        try {
            const glossaries = await translator.listGlossaries();
            expect(glossaries).toContainEqual(createdGlossary);
        } finally {
            await cleanupGlossary();
        }
    });

    it('should delete glossaries', async () => {
        const translator = makeTranslator();
        const [createdGlossary, cleanupGlossary] = await createManagedGlossary(translator, {
            sourceLang: 'en',
            targetLang: 'de',
            entries: new deepl.GlossaryEntries({ entries: { Hello: 'Hallo' } }),
        });
        try {
            await translator.deleteGlossary(createdGlossary);
            await expect(translator.getGlossary(createdGlossary.glossaryId)).rejects.toThrowError(
                deepl.GlossaryNotFoundError,
            );
        } finally {
            await cleanupGlossary();
        }

        await expect(translator.deleteGlossary(invalidGlossaryId)).rejects.toThrowError(
            deepl.DeepLError,
        );
        await expect(translator.deleteGlossary(nonExistentGlossaryId)).rejects.toThrowError(
            deepl.GlossaryNotFoundError,
        );
    });

    withRealServer('should translate text sentence using glossaries', async () => {
        const sourceLang = 'en';
        const targetLang = 'de';
        const inputText = 'The artist was awarded a prize.';
        const translator = makeTranslator();
        const [glossary, cleanupGlossary] = await createManagedGlossary(translator, {
            sourceLang,
            targetLang,
            entries: new deepl.GlossaryEntries({
                entries: {
                    artist: 'Maler',
                    prize: 'Gewinn',
                },
            }),
        });
        try {
            const result = await translator.translateText(inputText, 'en', 'de', { glossary });
            expect(result.text).toContain('Maler');
            expect(result.text).toContain('Gewinn');
        } finally {
            await cleanupGlossary();
        }
    });

    it('should create basic text using glossaries', async () => {
        const textsEn = ['Apple', 'Banana'];
        const textsDe = ['Apfel', 'Banane'];
        const entriesEnDe = new deepl.GlossaryEntries({
            entries: {
                Apple: 'Apfel',
                Banana: 'Banane',
            },
        });
        const entriesDeEn = new deepl.GlossaryEntries({
            entries: {
                Apfel: 'Apple',
                Banane: 'Banana',
            },
        });

        const translator = makeTranslator();
        const [glossaryEnDe, cleanupGlossaryEnDe] = await createManagedGlossary(translator, {
            sourceLang: 'en',
            targetLang: 'de',
            entries: entriesEnDe,
            glossaryNameSuffix: '_ende',
        });
        const [glossaryDeEn, cleanupGlossaryDeEn] = await createManagedGlossary(translator, {
            sourceLang: 'de',
            targetLang: 'en',
            entries: entriesDeEn,
            glossaryNameSuffix: '_deen',
        });
        try {
            let result = await translator.translateText(textsEn, 'en', 'de', {
                glossary: glossaryEnDe,
            });
            expect(result.map((textResult: deepl.TextResult) => textResult.text)).toStrictEqual(
                textsDe,
            );

            result = await translator.translateText(textsDe, 'de', 'en-US', {
                glossary: glossaryDeEn,
            });
            expect(result.map((textResult: deepl.TextResult) => textResult.text)).toStrictEqual(
                textsEn,
            );
        } finally {
            await cleanupGlossaryEnDe();
            await cleanupGlossaryDeEn();
        }
    });

    it('should translate documents using glossaries', async () => {
        const [exampleDocumentPath, , outputDocumentPath] = tempFiles();
        const inputText = 'artist\nprize';
        const expectedOutputText = 'Maler\nGewinn';
        fs.writeFileSync(exampleDocumentPath, inputText);
        const translator = makeTranslator();
        const [glossary, cleanupGlossary] = await createManagedGlossary(translator, {
            sourceLang: 'en',
            targetLang: 'de',
            entries: new deepl.GlossaryEntries({
                entries: {
                    artist: 'Maler',
                    prize: 'Gewinn',
                },
            }),
        });

        try {
            await translator.translateDocument(
                exampleDocumentPath,
                outputDocumentPath,
                'en',
                'de',
                { glossary },
            );
            expect(fs.readFileSync(outputDocumentPath).toString()).toBe(expectedOutputText);
        } finally {
            await cleanupGlossary();
        }
    }, 20000); // Increased timeout for test involving document translation

    it('should reject translating invalid text with glossaries', async () => {
        const text = 'Test';
        const entries = new deepl.GlossaryEntries({ entries: { Hello: 'Hallo' } });
        const translator = makeTranslator();
        const [glossaryEnDe, cleanupGlossaryEnDe] = await createManagedGlossary(translator, {
            sourceLang: 'en',
            targetLang: 'de',
            entries,
            glossaryNameSuffix: '_ende',
        });
        const [glossaryDeEn, cleanupGlossaryDeEn] = await createManagedGlossary(translator, {
            sourceLang: 'de',
            targetLang: 'en',
            entries,
            glossaryNameSuffix: '_deen',
        });
        try {
            await expect(
                translator.translateText(text, null, 'de', { glossary: glossaryEnDe }),
            ).rejects.toThrowError('sourceLang is required');
            await expect(
                translator.translateText(text, 'de', 'en-US', { glossary: glossaryEnDe }),
            ).rejects.toThrowError('Lang must match glossary');
            const targetLangEn = <deepl.TargetLanguageCode>'en'; // Type cast to silence type-checks
            await expect(
                translator.translateText(text, 'de', targetLangEn, { glossary: glossaryDeEn }),
            ).rejects.toThrowError("targetLang='en' is deprecated");
        } finally {
            await cleanupGlossaryEnDe();
            await cleanupGlossaryDeEn();
        }
    });
});
