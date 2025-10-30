// Copyright 2022 DeepL SE (https://www.deepl.com)
// Use of this source code is governed by an MIT
// license that can be found in the LICENSE file.

import * as deepl from 'deepl-node';

import nock from 'nock';

import fs from 'fs';
import path from 'path';
import util from 'util';

import {
    documentTranslationTestTimeout,
    exampleDocumentInput,
    exampleDocumentOutput,
    exampleText,
    makeTranslator,
    tempFiles,
    testTimeout,
    timeout,
    urlToMockRegexp,
    withMockServer,
    withRealServer,
} from './core';
import { DocumentTranslateOptions, QuotaExceededError } from 'deepl-node';

describe('translate document', () => {
    it(
        'should translate using file paths',
        async () => {
            const translator = makeTranslator();
            const [exampleDocument, , outputDocumentPath] = tempFiles();
            await translator.translateDocument(exampleDocument, outputDocumentPath, null, 'de');
            expect(fs.readFileSync(outputDocumentPath).toString()).toBe(exampleDocumentOutput);
        },
        testTimeout,
    );

    it('should not translate to existing output files', async () => {
        const translator = makeTranslator();
        const [exampleDocument, , outputDocumentPath] = tempFiles();
        fs.writeFileSync(outputDocumentPath, fs.readFileSync(exampleDocument).toString());
        await expect(
            translator.translateDocument(exampleDocument, outputDocumentPath, null, 'de'),
        ).rejects.toThrow('exists');
    });

    it('should not translate non-existent files', async () => {
        const translator = makeTranslator();
        const [, , outputDocumentPath] = tempFiles();
        await expect(
            translator.translateDocument('nonExistentFile.txt', outputDocumentPath, null, 'de'),
        ).rejects.toThrow('no such file');
    });

    it(
        'should translate using file streams',
        async () => {
            const translator = makeTranslator();
            const [exampleDocument, , outputDocumentPath] = tempFiles();

            const inputFileStream = fs.createReadStream(exampleDocument, { flags: 'r' });

            // Omitting the filename parameter will result in error
            await expect(translator.uploadDocument(inputFileStream, null, 'de')).rejects.toThrow(
                'options.filename',
            );

            const handle = await translator.uploadDocument(inputFileStream, null, 'de', {
                filename: 'test.txt',
            });
            const { status } = await translator.isDocumentTranslationComplete(handle);
            expect(status.ok() && status.done()).toBeTruthy();

            const outputFileStream = fs.createWriteStream(outputDocumentPath, { flags: 'wx' });
            await translator.downloadDocument(handle, outputFileStream);
            expect(fs.readFileSync(outputDocumentPath).toString()).toBe(exampleDocumentOutput);
        },
        testTimeout,
    );

    it(
        'should translate using buffer input',
        async () => {
            const translator = makeTranslator();
            const [exampleDocument, , outputDocumentPath] = tempFiles();
            const inputBuffer = await fs.promises.readFile(exampleDocument);
            await translator.translateDocument(inputBuffer, outputDocumentPath, null, 'de', {
                filename: exampleDocument,
            });
            expect(fs.readFileSync(outputDocumentPath).toString()).toBe(exampleDocumentOutput);
        },
        testTimeout,
    );

    it(
        'should translate using file handles',
        async () => {
            const translator = makeTranslator();
            const [exampleDocument, , outputDocumentPath] = tempFiles();
            const inputHandle = await fs.promises.open(exampleDocument, 'r');
            const outputHandle = await fs.promises.open(outputDocumentPath, 'w');
            await translator.translateDocument(inputHandle, outputHandle, null, 'de', {
                filename: exampleDocument,
            });
            expect(fs.readFileSync(outputDocumentPath).toString()).toBe(exampleDocumentOutput);
        },
        testTimeout,
    );

    withMockServer('should translate with retries', async () => {
        const translator = makeTranslator({ minTimeout: 100, mockServerNoResponseTimes: 1 });
        const [exampleDocument, , outputDocumentPath] = tempFiles();
        await translator.translateDocument(exampleDocument, outputDocumentPath, null, 'de');
        expect(fs.readFileSync(outputDocumentPath).toString()).toBe(exampleDocumentOutput);
    });

    withMockServer(
        'should translate with waiting',
        async () => {
            const translator = makeTranslator({
                mockServerDocQueueTime: 2000,
                mockServerDocTranslateTime: 2000,
            });
            const [exampleDocument, , outputDocumentPath] = tempFiles();
            await translator.translateDocument(exampleDocument, outputDocumentPath, null, 'de');
            expect(fs.readFileSync(outputDocumentPath).toString()).toBe(exampleDocumentOutput);
        },
        documentTranslationTestTimeout,
    );

    withRealServer(
        'should translate using formality',
        async () => {
            const unlinkP = util.promisify(fs.unlink);
            const translator = makeTranslator();
            const [exampleDocument, , outputDocumentPath] = tempFiles();
            fs.writeFileSync(exampleDocument, 'How are you?');

            await translator.translateDocument(exampleDocument, outputDocumentPath, null, 'de', {
                formality: 'more',
            });
            expect(fs.readFileSync(outputDocumentPath).toString()).toContain('Ihnen');
            await unlinkP(outputDocumentPath);

            await translator.translateDocument(exampleDocument, outputDocumentPath, null, 'de', {
                formality: 'default',
            });
            expect(fs.readFileSync(outputDocumentPath).toString()).toContain('Ihnen');
            await unlinkP(outputDocumentPath);

            await translator.translateDocument(exampleDocument, outputDocumentPath, null, 'de', {
                formality: 'less',
            });
            expect(fs.readFileSync(outputDocumentPath).toString()).toContain('dir');
        },
        testTimeout,
    );

    it('should reject invalid formality', async () => {
        const translator = makeTranslator();
        const [exampleDocument, , outputDocumentPath] = tempFiles();
        const formality = <deepl.Formality>'formality'; // Type cast to silence type-checks
        await expect(
            translator.translateDocument(exampleDocument, outputDocumentPath, null, 'de', {
                formality,
            }),
        ).rejects.toThrow('formality');
    });

    it(
        'should handle document failure',
        async () => {
            const translator = makeTranslator();
            const [exampleDocument, , outputDocumentPath] = tempFiles();
            fs.writeFileSync(exampleDocument, exampleText.de);
            // Translating text from DE to DE will trigger error
            const promise = translator.translateDocument(
                exampleDocument,
                outputDocumentPath,
                null,
                'de',
            );
            await expect(promise).rejects.toThrow(/Source and target language/);
        },
        documentTranslationTestTimeout,
    );

    it('should reject invalid document', async () => {
        const translator = makeTranslator();
        const [, , , tempDir] = tempFiles();
        const invalidFile = path.join(tempDir, 'document.invalid');
        fs.writeFileSync(invalidFile, 'Test');
        await expect(
            translator.translateDocument(invalidFile, exampleDocumentOutput, null, 'de'),
        ).rejects.toThrow(/(nvalid file)|(file extension)/);
    });

    withMockServer(
        'should support low level use',
        async () => {
            // Set a small document queue time to attempt downloading a queued document
            const translator = makeTranslator({
                mockServerDocQueueTime: 100,
            });
            const [exampleDocument, , outputDocumentPath] = tempFiles();
            let handle = await translator.uploadDocument(exampleDocument, null, 'de');
            let status = await translator.getDocumentStatus(handle);
            expect(status.ok()).toBe(true);

            // Test recreating handle as an object
            handle = { documentId: handle.documentId, documentKey: handle.documentKey };
            status = await translator.getDocumentStatus(handle);
            expect(status.ok()).toBe(true);

            while (status.ok() && !status.done()) {
                status = await translator.getDocumentStatus(handle);
                await timeout(200);
            }

            expect(status.ok()).toBe(true);
            expect(status.done()).toBe(true);
            await translator.downloadDocument(handle, outputDocumentPath);
            expect(fs.readFileSync(outputDocumentPath).toString()).toBe(exampleDocumentOutput);
        },
        testTimeout,
    );

    withMockServer(
        'should provide billed characters in document status',
        async () => {
            const translator = makeTranslator({
                mockServerDocQueueTime: 2000,
                mockServerDocTranslateTime: 2000,
            });
            const [exampleDocument, , outputDocumentPath] = tempFiles();

            const timeBefore = Date.now();
            const handle = await translator.uploadDocument(exampleDocument, null, 'de');
            const status = await translator.getDocumentStatus(handle);
            expect(status.ok()).toBe(true);
            expect(status.done()).toBe(false);

            const { handle: handleResult, status: statusResult } =
                await translator.isDocumentTranslationComplete(handle);
            expect(handle.documentId).toBe(handleResult.documentId);
            expect(handle.documentKey).toBe(handleResult.documentKey);

            expect(statusResult.ok()).toBe(true);
            expect(statusResult.done()).toBe(true);
            await translator.downloadDocument(handle, outputDocumentPath);
            const timeAfter = Date.now();

            // Elapsed time should be at least 4 seconds
            expect(timeAfter - timeBefore).toBeGreaterThan(4000);
            expect(fs.readFileSync(outputDocumentPath).toString()).toBe(exampleDocumentOutput);
            expect(statusResult.billedCharacters).toBe(exampleDocumentInput.length);
        },
        documentTranslationTestTimeout,
    );

    it('should reject not found document handles', async () => {
        const handle = { documentId: '1234'.repeat(8), documentKey: '5678'.repeat(16) };
        const translator = makeTranslator();
        await expect(translator.getDocumentStatus(handle)).rejects.toThrow('Not found');
    });

    describe('request parameter tests', () => {
        beforeAll(() => {
            nock.disableNetConnect();
        });

        it('sends extra request parameters', async () => {
            nock(urlToMockRegexp)
                .post('/v2/document', function (body) {
                    // Nock unfortunately does not support proper form data matching
                    // See https://github.com/nock/nock/issues/887
                    // And https://github.com/nock/nock/issues/191
                    expect(body).toContain('form-data');
                    expect(body).toContain('my-extra-parameter');
                    expect(body).toContain('my-extra-value');
                    return true;
                })
                .reply(456);
            const translator = makeTranslator();
            const dataBuf = Buffer.from('Example file contents', 'utf8');
            const options: DocumentTranslateOptions = {
                filename: 'example.txt',
                extraRequestParameters: { 'my-extra-parameter': 'my-extra-value' },
            };
            await expect(translator.uploadDocument(dataBuf, null, 'de', options)).rejects.toThrow(
                QuotaExceededError,
            );
        });
    });
});
