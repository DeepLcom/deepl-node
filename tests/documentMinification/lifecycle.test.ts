import * as path from 'path';
import * as fs from 'fs';
import { FsHelper } from '../../src/fsHelper';
import { makeTranslator, testFilePaths, withRealServer } from '../core';
import { DocumentTranslationError, Translator } from '../../src';
import { createMinifiableTestDocument, verifyDocumentIsTranslated } from './testHelpers';
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

    withRealServer('should call minify, translate, and deminify', async () => {
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

    withRealServer('document should be translated after deminification', async () => {
        const originalFile = testFilePaths.pptx;
        const translator = makeTranslator() as Translator;

        const minifiableFilePath = createMinifiableTestDocument(
            originalFile,
            `${tempDir}/test-document-zip-content`,
            tempDir,
        );

        const outputFilePath = `${tempDir}/translatedAndDeminified${path.extname(originalFile)}`;

        // Translate with minification enabled
        await translator.translateDocument(minifiableFilePath, outputFilePath, 'en', 'de', {
            enableDocumentMinification: true,
        });

        expect(fs.existsSync(outputFilePath)).toBe(true);

        // Verify the document was translated
        verifyDocumentIsTranslated(minifiableFilePath, outputFilePath);
    });

    withRealServer('expect 413 if input file is not a string', async () => {
        const originalFile = testFilePaths.pptx;
        const translator = makeTranslator() as Translator;

        const minifiableFilePath = createMinifiableTestDocument(
            originalFile,
            `${tempDir}/test-document-zip-content-stream`,
            tempDir,
        );

        const outputFilePath = `${tempDir}/translatedAndDeminifiedStream${path.extname(
            originalFile,
        )}`;

        // Create a read stream for the input file
        const inputFileStream = fs.createReadStream(minifiableFilePath, { flags: 'r' });

        // Expect error when trying to use minification with file stream (non-string input)
        await expect(
            translator.translateDocument(inputFileStream, outputFilePath, 'en', 'de', {
                enableDocumentMinification: true,
                filename: path.basename(minifiableFilePath),
            }),
        ).rejects.toThrowError(DocumentTranslationError);
    });
});
