import * as fs from 'fs';
import * as deepl from 'deepl-node';
import pLimit from 'p-limit';
import * as path from 'path';

// Sets a global concurrency limit of 10 for the translation requests
// This is an external library to simplify this example, if you don't
// want to use it, you will need to implement your own concurrency
// control logic.
const limit = pLimit(10);

class ResultOrError<T> {
    constructor(public result: T | null, public error: Error | null) {}
}

// Example function to translate an array of texts into multiple target languages
// This currently uses source language detection, a source language could also be set for each text.
// In the output array, result[i][j] is the translation of texts[i] into targetLangs[j].
async function bulkTextTranslate(
    deeplClient: deepl.DeepLClient,
    texts: string[],
    targetLangs: deepl.TargetLanguageCode[],
): Promise<ResultOrError<deepl.TextResult>[][]> {
    const allPromises: Promise<ResultOrError<deepl.TextResult>>[][] = [];
    const wrappedTranslateText = async (text: string, targetLang: deepl.TargetLanguageCode) => {
        try {
            const result = await deeplClient.translateText(text, null, targetLang);
            return new ResultOrError<deepl.TextResult>(result, null);
        } catch (error) {
            return new ResultOrError<deepl.TextResult>(null, error);
        }
    };
    for (const text of texts) {
        const promisesForText: Promise<ResultOrError<deepl.TextResult>>[] = [];
        for (const targetLang of targetLangs) {
            promisesForText.push(limit(() => wrappedTranslateText(text, targetLang)));
        }
        allPromises.push(promisesForText);
    }

    // This is not optimal for performance, you likely want to enqueue the requested translations
    // instead and dynamically take them from the queue, but this is a simple example.
    const results: ResultOrError<deepl.TextResult>[][] = [];
    for (const promisesForText of allPromises) {
        const resultsForText = await Promise.all(promisesForText);
        results.push(resultsForText);
    }
    // This returns a 2D array where each sub-array corresponds to the translations of a single text
    // Another way would be to return an array of objects with the target language and the associated translation.
    return results;
}

// Example function to translate an array of texts into multiple target languages
// This currently uses source language detection, a source language could also be set for each text.
// In the output array, result[i][j] is the status of inputFiles[i] being translated into targetLangs[j].
async function bulkDocumentTranslate(
    deeplClient: deepl.DeepLClient,
    inputFiles: string[],
    outputDir: string,
    targetLangs: deepl.TargetLanguageCode[],
): Promise<ResultOrError<deepl.DocumentStatus>[][]> {
    const allPromises: Promise<ResultOrError<deepl.DocumentStatus>>[][] = [];
    const wrappedTranslateDocument = async (
        inputFile: string | Buffer | fs.ReadStream | fs.promises.FileHandle,
        outputFile: string | fs.WriteStream | fs.promises.FileHandle,
        targetLang: deepl.TargetLanguageCode,
    ) => {
        try {
            const result = await deeplClient.translateDocument(
                inputFile,
                outputFile,
                null /** sourceLang */,
                targetLang,
            );
            return new ResultOrError<deepl.DocumentStatus>(result, null);
        } catch (error) {
            return new ResultOrError<deepl.DocumentStatus>(null, error);
        }
    };
    inputFiles.forEach((inputFile) => {
        const promisesForDocument: Promise<ResultOrError<deepl.DocumentStatus>>[] = [];
        targetLangs.forEach((targetLang) => {
            promisesForDocument.push(
                limit(() =>
                    wrappedTranslateDocument(
                        inputFile,
                        path.join(outputDir, `${path.parse(inputFile).name}-${targetLang}.txt`),
                        targetLang,
                    ),
                ),
            );
        });
        allPromises.push(promisesForDocument);
    });

    // This is not optimal for performance, you likely want to enqueue the requested translations
    // instead and dynamically take them from the queue, but this is a simple example.
    const results: ResultOrError<deepl.DocumentStatus>[][] = [];
    for (const promisesForDocument of allPromises) {
        const resultsForDocument = await Promise.all(promisesForDocument);
        results.push(resultsForDocument);
    }
    return results;
}

const authKey = process.env['DEEPL_AUTH_KEY'];
if (authKey === undefined) throw new Error('DEEPL_AUTH_KEY environment variable not defined');
const serverUrl = process.env['DEEPL_SERVER_URL'];
const deeplClient = new deepl.DeepLClient(authKey, { serverUrl: serverUrl });

(async () => {
    try {
        console.log(await deeplClient.getUsage());

        const targetLangs: deepl.TargetLanguageCode[] = ['fr', 'de', 'es'];
        const texts = ['Hello, world!', 'This is a test.', 'DeepL is great!'];
        const results = await bulkTextTranslate(deeplClient, texts, targetLangs);
        for (const resultRow of results) {
            for (const result of resultRow) {
                if (result.error) {
                    console.error(`Error translating text: ${result.error.message}`);
                } else {
                    console.log(result.result.text);
                }
            }
        }
        const inputFiles = ['example1.txt', 'example2.txt'];
        const outputDir = './output';
        const docResults = await bulkDocumentTranslate(
            deeplClient,
            inputFiles,
            outputDir,
            targetLangs,
        );
        for (const resultsPerDocument of docResults) {
            for (const result of resultsPerDocument) {
                if (result.error) {
                    console.error(`Error translating document: ${result.error.message}`);
                } else {
                    console.log(
                        `Translated document: Status ${result.result.status} - Billed ${result.result.billedCharacters} characters`,
                    );
                }
            }
        }
    } catch (error) {
        console.log(error);
        process.exit(1);
    }
})();
