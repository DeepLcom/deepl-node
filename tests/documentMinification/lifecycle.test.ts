import * as path from 'path';
import * as fs from 'fs';
import { FsHelper } from '../../src/fsHelper';
import { makeTranslator, testFilePaths, withRealServer } from '../core';
import { DocumentTranslationError, Translator } from '../../src';
import { createMinifiableTestDocument } from './testHelpers';
import mock from 'mock-fs';

jest.setTimeout(100000);

describe('minification lifecycle with translate', () => {
    beforeEach(() => {
        // Use in-memory file system for fs, but load real folder from tests/resources
        mock({
            'tests/resources': mock.load('tests/resources'),
        });
    });

    afterEach(() => {
        mock.restore();
    });

    let tempDir: string;

    beforeEach(() => {
        tempDir = fs.mkdtempSync('test-doc-minifier-');
    });

    afterEach(() => {
        if (fs.existsSync(tempDir)) {
            FsHelper.removeSyncRecursive(tempDir);
        }
    });

    withRealServer('should minify, translate, and deminify', async () => {
        const originalFile = testFilePaths.pptx;
        const translator = makeTranslator() as Translator;

        const minifiableFilePath = createMinifiableTestDocument(
            originalFile,
            `${tempDir}/test-document-zip-content`,
            tempDir,
        );
        expect(fs.statSync(minifiableFilePath).size).toBeGreaterThan(30000000);

        const outputFilePath = `${tempDir}/translatedAndDeminified${path.extname(originalFile)}`;

        await translator.translateDocument(minifiableFilePath, outputFilePath, 'en', 'de', {
            enableDocumentMinification: true,
        });

        expect(fs.existsSync(outputFilePath)).toBe(true);
        expect(fs.statSync(outputFilePath).size).toEqual(fs.statSync(minifiableFilePath).size);
        // If the output exists, the input document must have been minified as TranslateDocumentAsync
        // will not succeed for files over 30 MB
        expect(fs.statSync(outputFilePath).size).toBeGreaterThan(30000000);
    });

    withRealServer(
        'should not minify when not specified and should error when translating too large of a document',
        async () => {
            const originalFile = testFilePaths.pptx;
            const translator = makeTranslator() as Translator;

            const minifiableFilePath = createMinifiableTestDocument(
                originalFile,
                `${tempDir}/test-document-zip-content`,
                tempDir,
            );
            expect(fs.statSync(minifiableFilePath).size).toBeGreaterThan(30000000);

            const outputFilePath = `${tempDir}/translatedAndDeminified${path.extname(
                originalFile,
            )}`;

            await expect(
                translator.translateDocument(
                    minifiableFilePath,
                    outputFilePath,
                    'en',
                    'de',
                    // do not include additional options
                ),
            ).rejects.toThrowError(DocumentTranslationError);
        },
    );
});
